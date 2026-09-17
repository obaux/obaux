-- 0060 — A conversation partner can see who they are talking to.
--
-- Messaging in PAM is staff-to-member, corrected from an earlier, wrong build
-- of member-to-member chat (see DECISIONS.md D-163, superseding D-159/160/161).
-- A case manager or a program admin reaching a member's caseload/enrollment
-- already had a `profiles` read policy (`profiles_select_admin_caseload`,
-- `profiles_select_provider_linked`). The other direction did not exist: a
-- member had no policy letting them read *their case manager's or program's*
-- profile row at all, so a conversation list or thread header for a member
-- would have had no name to show for the person messaging them.
--
-- This adds exactly that direction, symmetrically, scoped to "you already
-- share a conversation" — never a general staff/member directory. It answers
-- "who is this" for a relationship that only exists because a case manager or
-- program admin already started the conversation (see the follow-up migration
-- named in D-163 for the still-open question of who may start one).
create policy profiles_select_conversation_partner on public.profiles
  for select using (
    id <> auth.uid()
    and exists (
      select 1
      from public.conversation_members mine
      join public.conversation_members theirs
        on theirs.conversation_id = mine.conversation_id
      where mine.profile_id = auth.uid()
        and theirs.profile_id = public.profiles.id
    )
  );

comment on policy profiles_select_conversation_partner on public.profiles is
  'Lets a conversation participant read the profile row of whoever else is in '
  'that same conversation with them — needed so a member can see their case '
  'manager''s or program''s name, not just the reverse (0060). Exposes the '
  'whole row under RLS, including `phone`; nothing in apps/web selects it for '
  'this purpose today, and D-163 flags column-level tightening (the same '
  '`bidder_contact`-style REVOKE pattern used elsewhere) as a follow-up rather '
  'than something this migration does.';
