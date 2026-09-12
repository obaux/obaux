-- 0021 — Pin the search_path on the three functions that were missing it.
--
-- Supabase's linter flags `name_discloses_condition`, `url_encode_component`
-- and `google_place_url`. All three are `security invoker` and pure, so the
-- exposure is smaller than it would be on a definer function — but two of them
-- are called from inside triggers, where the search_path is whatever the writing
-- session set, and the third decides whether a name is treated as disclosing.
-- A function that answers "is this safe to put on a lock screen" should not be
-- resolvable to somebody else's `~*`.
--
-- No behaviour changes; `alter function ... set search_path` rewrites only the
-- setting. The repo rule (CLAUDE.md) already required this of definer functions;
-- this brings the rest in line.

alter function public.name_discloses_condition(text)
  set search_path = public, extensions, pg_temp;

alter function public.url_encode_component(text)
  set search_path = public, extensions, pg_temp;

alter function public.google_place_url(text, text, text)
  set search_path = public, extensions, pg_temp;
