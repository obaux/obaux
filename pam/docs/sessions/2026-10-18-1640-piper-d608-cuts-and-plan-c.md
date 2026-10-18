# Piper, 18 October: D-608 cuts, and where plan C stands

**D-608 (Sage's audit, claude/sage-signs):** the cuts on the place, flag and program lead screens are on `claude/places-programs-d608-cuts`. CUT means the element is gone and the key stays for Lena's retire sweep. `Notice` and `SetupCard` take no body now (Dot's files, optional only). Not done and why:
- `messages.empty.body.provider` and `MessagesView.tsx` are Nico's; he cuts all three `messages.empty.body.*` lines in the Message Pam switch-on batch.
- `points.intro` and `programs.review.text.body` are not drawn by any screen, so there was nothing to cut; they go to Lena's retire pass.
- The program page's services line (`program.services.hint`) has no e2e: `/program/` with examples shows no Services section. It rests on reading the diff.
- `book.new.note` was cut in its own commit (untrue: Add a person books nothing and texts nobody). `book.new.intro` is Lena's, in her D-608 batch.
- Kept for Will: `place.lead.sees`, `place.noLead` (a91); `policy.replace.hint` stays until card a102 is signed.

**Plan C** (`claude/places-programs-calendar-plan-c`, READY at 0e3b6169, held for Will's a97 yes and his iPhone try) is in its own log, `2026-10-18-0100-piper-a98-plan-c-the-calendar-link-shown-again.md`.

**The Sunday example-schedule fix** (4785216f, in b64) had no log of its own: a Sunday with no example times emptied the example schedule and broke the visit-row taps; its test puts the old formula back and fails 3.
