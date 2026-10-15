# D-583 — Answer by text shows who wrote and what they asked

**Date:** 2026-10-15 · **Branch:** `claude/messages-answer-by-text-context`

**Decided by:** Mira, relaying Iris's W3 (Super admin first pass, `docs/research/2026-10-15-super-admin-flow.md`), 15 October 2026: Answer by text showed a raw `+1` number and an empty box, so the reply was written blind. Answering by text itself stays off (D-524, D-547); this changes only the screen.

**What the screen shows now:**
- the number as a person reads it, `(215) 555-0142` (`displayPhone`);
- what they wrote and when, in a card above the box: "They wrote · Oct 15, 2026, 2:05 PM", and their words as written, shown as text, never as markup.

**Where the words and the time come from, and why nothing is stored:** the help request is stored nowhere (D-521: it is an email and a rate-limit hash), so they cannot be looked up. They ride in the link that opens the screen, in the part after `#`: `/reply/?to=+12155550142#q=<words>&at=<ISO time>`. A fragment never goes to a server, so it is in no request log. The screen reads it from the address and keeps nothing (`lib/replyContext.ts`: capped at the form's 3,000 characters, control characters out, a bad time dropped). **Nothing builds such a link today**: the email's "Reply by text" link is part of a61, which is off (D-547). When it is turned on, the help-request email must build the link with the words after `#`, never in the query. Storybook and demo accounts also accept `q` and `at` as ordinary query values so a story can show the screen; a real link does not use them. Anyone but the super admin gets the closed door and sees no words.

**New words** (Sage signs, Lena translates; drafts are in all seven languages): `supportReply.theyWrote` "They wrote".

## Held: showing whose number it is (Mira, 15 October)

The first build also showed "To Ana, (215) 555-0142": the first name of the account with the number, from a new super-admin-only RPC `profile_first_name_for_phone`. **Held, not shipped** (Mira, 15 October: "take the screen, hold the phone→name lookup"). The super admin already sees every first name in Everyone (`directory_people`), but could not go from a number to a name. Someone who writes to the help desk with a number would be tied to a named account, which members are not told about, Privacy does not describe, and nobody needs while answering by text is off (D-524).

**It goes on Will's card when texting people back (a61) is switched on**, with a Privacy line. The migration and DB test 74 were removed before merge; the function is kept here so it is ready (first name only, super admin only, null for an unknown number or a value that is not a phone number, no audit row). Its test checked: a number Pam knows, a lead's number, an unknown number, a non-phone value, a `%` pattern and null all return a first name or null; a member, a program lead and a signed-out caller are refused; `search_path` is set; nothing is written to the audit log. The screen then needs `supportReply.toNamed` "To {name}, {phone}" and a call to the function when `to` is set.

```sql
create or replace function public.profile_first_name_for_phone(p_phone text)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  found text;
begin
  if not public.is_super_admin() then
    raise exception 'Only the person running PAM looks up a number';
  end if;
  if p_phone is null or p_phone !~ '^\+[1-9]\d{7,14}$' then
    return null;
  end if;
  select p.first_name into found
  from public.profiles p
  where p.phone = p_phone
  limit 1;
  return found;
end;
$$;

revoke all on function public.profile_first_name_for_phone(text) from public, anon;
grant execute on function public.profile_first_name_for_phone(text) to authenticated;

revoke all on function public.profile_first_name_for_phone(text) from public, anon;
grant execute on function public.profile_first_name_for_phone(text) to authenticated;
```
