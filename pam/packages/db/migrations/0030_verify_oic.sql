-- 0030 — OIC Philadelphia is verified.
--
-- 0025 entered it with `verified = false` and said why: §6.4 shows an
-- organisation badge only once a human has verified the organisation, and
-- reading a website is not that. Will verified it.
--
-- `verified_by` stays null because there is still no admin account to point at
-- — that is the standing needs-a-human item, and inventing a profile id to fill
-- the column would make the audit trail worse, not better. The timestamp and
-- this migration are the record.

update public.orgs
set verified = true,
    verified_at = now()
where name = 'OIC Philadelphia';
