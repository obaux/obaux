# 13 September 2026 — Sign-in works, and the two pages a stranger can read

## What changed

**PAM sent its first real text message.** The sign-in code arrived on a real
phone after three separate failures, each a different layer. Sign-in now works
end to end for a verified number.

**The sign-in screen was rebuilt around one task.** The form — number, code, the
one button that acts on them — sits in a card. The wordmark is centred above it,
and everything else (help, what PAM will text you, privacy, terms) sits outside
the card as context. It is one door for everybody: member, program manager, case
manager, super admin. Nobody has to know what kind of user they are to get in.

**Privacy and Terms exist**, at `/privacy/` and `/terms/`, each with a contents
list that marks the section being read. The copy is structured data
(`packages/config/src/legal.ts`) with the words in the locale bundles, so both
pages are translated like everything else and a missing paragraph fails a test
rather than shipping as a gap.

## What was wrong, and what missed it

**Three failures stacked behind one another, and each hid the next.** Worth
writing down as a shape, because it will recur: "the thing is broken" was true
four times in a row, for four different reasons, and only fixing each one
revealed the next.

1. *Unsupported phone provider* — Twilio was paid for, but Supabase had never
   been pointed at it. Not a code problem at all.
2. *Database error finding user* — the admin account, created through the admin
   API, had columns left NULL where the auth service expects blank text. It
   failed looking the person up, before Twilio was ever involved. Repair is
   recorded in `docs/sms-setup.md`; the next seeded account will hit it too.
3. *Authenticate (20003)* — the credentials pasted into Supabase were not
   accepted. An auth token copied while still masked looks correct in the field.
4. *Invalid parameter (60200)*, then *21608* — the Verify service, then the
   trial-account limit. A trial Twilio account texts only hand-verified numbers,
   which no member can do for themselves.

Nothing in the test suite could have caught any of these, and that is the point:
every one lived in configuration, in an external account, or in a table this
project does not own. **The only thing that found them was asking the live system
to do the real thing and reading what came back.**

**The scroll-position mark on the legal pages was wrong twice before it was
right.** First version picked the section with the largest intersection ratio,
which made the mark jump backwards whenever a short section sat between two long
ones. Second version measured properly but only recomputed when an
IntersectionObserver fired — and scrolling within one long section crosses no
boundary, so the mark froze on exactly the pages where somebody is hunting for a
specific answer. It now measures on scroll, coalesced to one measurement per
frame, and treats the foot of the page as the last section: a short closing
section can never push its heading past the middle of the screen, because the
page runs out of scroll first.

The browser test caught the third case only because it asserted `aria-current`
on the *last* entry rather than on a convenient middle one.

## Decisions made

- One sign-in screen for every role. Roles appear at sign-up, never here: a
  separate door per role is a thing to explain, a second screen to keep working,
  and a URL that says something about you before you have signed in.
- The consent notice sits at the foot of the screen, and the test asserts it is
  on screen without scrolling rather than where it sits. Where it sits is a
  design decision; that somebody sees it before handing over a number is not.
- Legal copy lives in the locale bundles, structure in `legal.ts`. A privacy page
  that drifts out of Spanish is a privacy page most of the pilot cannot read.
- The privacy page is tested against the transparency contract. The page is read
  before joining, the screen after; if they disagreed, the quieter one would be
  the real promise.

## Verified

- `pnpm --filter @pam/config test` — 201 pass, 9 new: every legal string exists
  in both languages, anchors are unique, the copy carries no word that reduces
  somebody to their record, the median paragraph reads at grade 7 or below, and
  the privacy page restates each limit the transparency screen states.
- `pnpm --filter @pam/web test:a11y` — 153 pass, 33 new. Both pages are axe-clean
  at 320px, in dark mode, and at iPhone SE size; every contents entry lands on a
  heading that exists; the mark follows the reading position.
- First-load JS 490.1 kB of the 500 kB budget. **9.9 kB of headroom** — the next
  screen will need some of it back.
- Live: a sign-in code delivered to a real phone.

## Left undone

- **Twilio is still a trial account.** Only hand-verified numbers can receive a
  text, so the pilot cannot start until the compliance profile and the carrier
  registration are approved. Registration details are in `docs/sms-setup.md`;
  the sample messages to paste are in `docs/sms-campaign-samples.md`.
- The SMS copy still has no name against it, so the dispatcher still refuses
  every queued message. This is correct and deliberate.
- The notification bar in the case manager and super admin headers, the member
  profile behind a person card, and the five-tab member shell.

## Needs a human

1. Twilio: Primary Compliance Profile, then the A2P brand under **Oba** (the
   registered company) with PAM as the campaign. Screenshot of the sign-in screen
   is what the reviewer wants for the opt-in question.
2. A name against the SMS copy.
