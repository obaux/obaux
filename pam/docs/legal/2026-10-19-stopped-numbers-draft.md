# A stopped number follows its number onto an account — draft for Lena's read (19 October 2026), revised after her read (a38ed8a6)

Nico. Mira, 01:00: draft it, keep no readable number, keyed hash in the Vault, nothing else in the table, Lena reads before anything is built
past the draft, Sage writes the Privacy line, Will signs. Texts stay off until both are live.
Branch `claude/messages-stopped-numbers`; migration `20261019010454_a_stopped_number_is_kept_as_a_keyed_hash_and_follows_the.sql`; test 86.
**Nothing here is applied and nothing sends.**

## What was already true (D-524, live or in the queue)

`phone_stops (phone_hash, stopped_at)` already keeps a number that texted STOP when no account has it. START removes it. It was hashed with a plain
SHA-256, which is not a protection for phone numbers: there are only a few hundred million possible US numbers, so anyone who could read the table
could test every one. The table had a time to the second. And nothing carried the stop onto an account that later used the number.

## What the draft changes

1. **Keyed hash.** HMAC-SHA256 of the E.164 number, key `phone_stop_key` made in the Vault by the migration, readable only by the two hash functions
   (not by `anon`, `authenticated` or even `service_role`). Stored with a `k1:` prefix so a new hash and an old one can be told apart. Without the key
   the table cannot be turned back into numbers or tested against a guess.
2. **A day, not a moment.** `stopped_at` becomes a `date`. Two columns in all: the hash and the day.
3. **The stop follows the number.** When an account is created with a number, or changes its number, a trigger hashes it, and if the hash is in the
   table, puts the stop on the account (`sms_stopped_at`, texts still off, never a yes). It never clears a stop; only START does. The audit log
   notes that a stop was carried, naming the account and nothing about the number.
4. **START removes it**, in either hash form, and clears the account's stop as it already did.
5. **Old rows still stop.** The old plain-hash rows are not rehashed (a one-way hash cannot be redone without the number). They still count, still
   carry onto an account, and go when a START removes them.

## What I need from Lena

- **Is a keyed hash of the number of someone with no account personal data?** I treat it as such. It is one fact (this number said STOP), a day, and
  no way to read the number back without the key. Is that enough for the Privacy page's promise, or is something more needed?
- **Retention.** Today it is kept until a START, with no end. A carrier-grade STOP is meant to be honoured for as long as the number is ours to text.
  Should it expire (e.g. after a number could have been reassigned), and if so after how long? I have not built an expiry.
- **Key handling.** The key must never be rotated, because a stop cannot be rehashed without its number: a new key would forget every stop. I have
  written that into the migration's comments. Is a backup/rotation promise needed in the Privacy line, or is it an engineering note only?
- **Who could in principle compare a number to the list.** Only code running inside the database as its owner (the Vault key is not reachable by
  any client role or by the service role). Someone with database-owner access can do it. Is that acceptable, as it is for the other hashed lookup we
  keep (`support_texts_log`)?
- **The account's side.** A person who texted STOP and then joined with that number now starts stopped, and the consent screen shows it (the app
  already does for a stopped account). Is the existing "you replied STOP" wording right for someone who did that before they had an account?

## Words for Sage (the Privacy line, for Will to sign)

A draft only: "If you reply STOP to a Pam text, Pam keeps a scrambled version of your number, with the day, so it never texts you again, even if
you have no Pam account yet. Nobody can turn it back into your number. Reply START to a Pam text and it is deleted." Sage rewrites.

## Proof

Test 86: the stop is kept as one row of two columns, the hash keyed (`k1:`, not the old digest, none of the number in it, and a different key does not
match); the stop follows the number onto an existing account and onto a new one, with no yes; the audit row carries no number; an unrelated account is
untouched; START empties the list and clears the account; an old plain-hash row still stops, carries and goes; no client role reads the list, the hash
or the key, and the service role cannot call the key. Mutations: switching the carry trigger off fails "an account that takes the stopped number gets
the stop"; making the hash unkeyed fails "the hash is keyed". Full DB suite passes.

## What I did not do

No expiry; no rehash of old rows; no change to what a STOP from a known number does (unchanged); no Privacy page edit (Sage and Will); nothing that
sends.

## Revised after Lena's read (01:12)

1. **Who can compare.** The service role could: it had `phone_hash` and the table. Now `phone_hash` and the table are closed to it too (tested). It can still
   ask `phone_is_stopped(number)`, because the dispatcher has to ask about a number. So the Privacy line must not say "nobody can". What the keyed hash
   protects is a copy of the table (backup, dump, export) being useless without the key.
2. **The row after a carry.** Deleted when the stop is carried onto the account, so the list holds only people with no account and a stop goes with
   the account it lives on. A deleted person who comes back starts with texts off and must say yes again. (Lena's recommendation; the other choice
   would have meant "it stays after you delete your account" on the page.)
3. **Old plain-hash rows.** Removed from the design: no legacy function, no "or legacy" branches. The migration refuses to run if `phone_stops` has any row,
   so the desk reads `count(*)` first (Lena expects 0: sms-inbound has never been on). If it is not 0, we decide together before applying.
4. **The key** is a launch item (Lena put it on the before-launch list): a lost key, or a project move without the Vault, makes every `k1:` stop stop
   matching. `PHONE_STOP_KEY_MISSING` raises rather than guessing.
5. **Sage's line**: Lena's rewrite replaces my draft line above ("Nobody can turn it back into your number" is not true).

## Revised after the desk's decisions (Mira, 01:11)

- No old rows exist (live count: `phone_stops` 0, `support_texts_log` 0). The migration deletes any old-hash row it finds, with the reason in its header.
- `stopped_at` is dropped: the table is the keyed hash and nothing else.
- **An erased account that was stopped puts the keyed hash of its number back in the list**, so that number stays stopped. This is the one case where the
  list holds a number that once had an account. It means "delete my account" leaves a scrambled code of the number behind when the person had replied
  STOP; the Privacy line has to say so (Lena: this changes how-long.p1 and your-choices.p2, which promise deletion on request; the stop is kept so we never
  text a number that asked us to stop, and it goes on a START).
- Nothing is written to the audit log or any log on the no-account branch (tested).
- `support_texts_log` keeps the keyed hash, not the plain one; its old rows (none) are deleted.
