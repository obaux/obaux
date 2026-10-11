# D-510 — A wrong code stays on the code step with a small alert, no Call

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-wrong-code-alert`

**Decided by:** Will, via the merge desk (11 October 2026, 03:00 UTC), after typing a wrong code on his phone in dark mode: "When I entered the code wrong, we should subset this component and use a small alert banner. Don't have them call for this issue. Just try again."

**Why.** A wrong or expired code is a slip fixed on the spot. It showed the full Notice card (title, reason, a big "Call Pam for help" button) and sent the person back to the phone-number step, which made a typo feel like a failure that needed a phone call.

**What.**
- `@pam/ui` gets `CompactNotice` (`Notice.tsx`): one row, a small icon and one line, no action; the same three tones and alert role as `Notice`. **Use it for a mistake the person fixes where they are; use `Notice` for a state they are stuck in** (said in the file's comment and in Storybook, Components › Feedback › Notice › Compact).
- `usePhoneSignIn`: a refused code now leaves the state at `{ step: 'code', phone, error: 'verify' }` instead of `{ step: 'failed', reason: 'verify' }`. `failed` is now only "we could not send the code", which keeps its Notice (card a54 will change that line).
- `PhoneSignInCard`: on that error the boxes are emptied and the cursor put back in them (`CodeBoxes` takes an `inputRef`), the alert shows right under the boxes and goes as soon as they type, and "Send again" is unchanged. `CodeBoxes` also now lets the same six digits be tried again (`onComplete` fired once per distinct code and swallowed a retry of the same one).
- Copy: new `signin.code.wrong` — "That code did not work. Try again." (six drafts for Lena). It replaces `signin.failed.verify.title` and `.body`, which are removed from all seven languages and the ledger. It reads short enough with "Send again" directly under it; no better line needed.
- Tests: `e2e/signin-wrong-code.spec.ts` (stays on the code step, small alert, empty field with focus, no Call button or `tel:` link, same code retried, a right code signs in, alert gone on typing, axe in three projects); `signin-short.spec.ts` at 320×568 in en/es/ar with the alert showing.

**What a later session might reverse.** The alert is hidden once they type; the field is emptied rather than left to correct. An expired code and a wrong one say the same line, because from the screen they look the same and the remedy is the same.
