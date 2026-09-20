#!/usr/bin/env bash
# Runs the migrations and the RLS suite against a throwaway Postgres.
#
# This is the check that matters most in CI: the privacy promises in §4.1 are
# enforced by policies, and a policy is only as good as the test that attacks it.
#
# Requires: postgresql 16 + postgis + pgcrypto. See packages/db/README.md.
#
# Two modes:
#   * PAM_TEST_DSN set  -> use that database (a CI service container)
#   * otherwise         -> spin up a throwaway local cluster
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
PORT="${PGPORT:-55432}"
WORKDIR="${PAM_DB_TEST_DIR:-$(mktemp -d)}"
PGDATA="$WORKDIR/pgdata"
SOCKET="$WORKDIR/run"
DB="pam_test"
OWNER="${PAM_PG_OWNER:-postgres}"

run_suite() {
  local -n _psql=$1
  echo "==> Supabase shim"
  "${_psql[@]}" -f "$HERE/test/00_supabase_shim.sql" >/dev/null

  echo "==> Migrations"
  for f in "$HERE"/migrations/*.sql; do
    printf '    %s\n' "$(basename "$f")"
    "${_psql[@]}" -f "$f" >/dev/null
  done

  echo "==> Fixture"
  "${_psql[@]}" -f "$HERE/test/01_seed.sql" >/dev/null

  local failed=0
  for f in "$HERE"/test/0[2-9]_*.sql; do
    if ! "${_psql[@]}" -f "$f" 2>&1 \
        | sed -E 's/^psql:[^ ]+ //; s/^NOTICE:  //' \
        | grep -E '^(ok |FAIL|ERROR|--- )'; then
      failed=1
    fi
  done

  if [ "$failed" -ne 0 ]; then
    echo "FAILED" >&2
    exit 1
  fi
  echo ""
  echo "All database checks passed."
}

# CI path: a Postgres+PostGIS service container is already running.
if [ -n "${PAM_TEST_DSN:-}" ]; then
  CI_PSQL=(psql "$PAM_TEST_DSN" -v ON_ERROR_STOP=1 -q)
  run_suite CI_PSQL
  exit 0
fi

cleanup() {
  su "$OWNER" -c "$PGBIN/pg_ctl -D $PGDATA stop -m immediate" >/dev/null 2>&1 || true
}
trap cleanup EXIT

mkdir -p "$PGDATA" "$SOCKET"
# initdb refuses to run as root, so the cluster is owned by the postgres user.
if [ "$(id -u)" -eq 0 ]; then
  chown -R "$OWNER":"$OWNER" "$WORKDIR"
  # The postgres user also has to be able to traverse every parent directory.
  # A scratch dir under a private path is the usual cause of a confusing
  # "could not access directory" from initdb.
  d="$WORKDIR"
  while [ "$d" != "/" ]; do chmod o+x "$d" 2>/dev/null || true; d="$(dirname "$d")"; done
  RUN="su $OWNER -c"
else
  RUN="bash -c"
fi

$RUN "$PGBIN/initdb -D $PGDATA -U postgres --auth=trust" >/dev/null
$RUN "$PGBIN/pg_ctl -D $PGDATA -l $PGDATA/server.log -o '-p $PORT -k $SOCKET' start" >/dev/null
for _ in $(seq 1 30); do
  "$PGBIN/pg_isready" -h "$SOCKET" -p "$PORT" >/dev/null 2>&1 && break
  sleep 0.5
done

PSQL=("$PGBIN/psql" -h "$SOCKET" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -c "create database $DB;" >/dev/null

LOCAL_PSQL=("${PSQL[@]}" -d "$DB")
run_suite LOCAL_PSQL
