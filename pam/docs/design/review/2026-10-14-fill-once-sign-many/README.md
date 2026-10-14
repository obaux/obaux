# Fill once, sign many: the member's side (pictures only, 390px, light and dark)

## Decided (Will, 14 October, 06:28): good news in green
"Good news in green is a nice touch." A confirmation, something that is done, is Astryx's `Banner` with `status="success"` (green): "Signed and sent to…" (2b), "DocuSign has it" (3b), and on both done screens "Sent to the programs" and "Not stored in Pam" (4a, 4b). An informational note stays the subtle blue `Banner status="info"` he asked for at 04:43: "Pam doesn't keep these", "Gone when you are done", "Pick up whenever you like". The blue-and-green comparison tiles are gone; green is the only version. "Undo this signature" and "Skip this one for now" stay above the main button (the Skip question is still Will's to answer). The rounds below are the history.

## Fourth round: the primary stays put (Will, 14 October, 05:18)
"Move undo this signature button to top of Primary action, so primary button is placed at same place across all." In the pinned strip, "Undo this signature" (2b, and its success-banner comparison) now sits **above** the primary button, so the primary is in the same place at the bottom on every screen. I did the same for "Skip this one for now" on 2a, for the same reason (Will's note named only Undo; say if he wants Skip left below). Redrawn: 2a-sign, 2b-signed-next, 2b-compare-signed-as-success, light and dark, and both sheets. The blue and green versions are both kept.

## Third round: the banner Will meant (14 October, 04:43)
Will: the green card on the place page is not the alert banner he meant; he meant the subtle blue one ("this program wasn't created in Pam and the dates are only for your convenience"). That is Astryx's **`Banner` with `status="info"`**, as on the place page (`apps/web/src/app/place/page.tsx`, `<Banner status="info" title={t('place.noLead', …)} />`). Every note on every screen is now that component: "Pam doesn't keep these", "Gone when you are done", "Pick up whenever you like", "DocuSign has it", "Signed and sent to…", "Sent to the programs" and both "Not stored in Pam". Titles and bodies unchanged (a note with only a line shows it as the title). The fixed buttons, the 8px stacking and the two done screens are as before.

**For Will to pick:** a confirmation can read wrong in blue, so two screens are also drawn with `Banner status="success"` (green): `2b-compare-signed-as-success` and `4a-compare-done-as-success`, for "Signed and sent to…", "Sent to the programs" and "Not stored in Pam". On the sheets they are the last two tiles, beside their blue versions (2b and 4a).

## Second round: Will's four notes on card a85 (04:31)
1. Banner look: first drawn as the place page's green `VisitCard`; **replaced in the third round above.**
2. **Main buttons fixed to the bottom on every screen.** Every screen uses `Page`'s footer (pinned strip, the page fading out above it, clearing the home indicator through `env(safe-area-inset-bottom)`), so content scrolls under it. The DocuSign screen has no Pam main button (DocuSign draws its own Sign), so the strip holds the help link. See 1a and 1b.
3. **All 112 signed:** the two notes sit close together (8px apart), then the Your copies card below.
4. **The cleared note, in Sage's words (mock words, she signs them when forms are built), one per route** because "no longer" is only true where Pam had the details for a while. **4a, Pam-only:** "Not stored in Pam. The name, birth date and Social Security number you typed for this form are no longer stored in Pam." **4b, DocuSign:** "Not stored in Pam. Pam never had the name, birth date and Social Security number you gave for this form. They went straight to DocuSign." On 4b the copies card says DocuSign sends the member their copies; Pam has none (stand-in words).

**For the build (not in the pictures):** the app's `body` carries 72px of bottom padding for the HelpBar (`globals.css`), which lifts a pinned `Page` footer 72px off the bottom once a page is scrolled to its end. The pictures were taken without it.

## 1 · Fill once
- **1a** Your details for the sitting: name, initials, birth date, today's date (read-only, filled for them). At the top, a calm card: Pam doesn't keep these; they stay on the phone and are cleared when you finish or close Pam.
- **1b** The Social Security number is the most careful field: its own box with a heavy accent edge, a shield, one plain line (not saved, not sent to Pam, hidden again when you leave the screen), the entry shown as dots, and "Show it while I check" so it is never open by default.
- **1c** One look before the first form, every detail as a list (SSN dotted), "Change something", and a reminder that it is gone when they are done.

## 2 · Sign many
- **2a** One form per screen, as a white page with the fields already filled in (white in dark mode too: it stands for the PDF). The bar says which form, "Form 3 of 112", with a progress bar; one clear primary, **Sign this form**; "Skip this one for now" beneath.
- **2b** After signing: their signature on the line, "Signed and sent to [program]", and the one primary becomes **Next form** with the count, "4 of 112" (the quiet count from D-560). "Undo this signature" stays within reach.
- **2c** Pause and coming back: progress, a calm card that says Pam remembers which forms are signed but not their details, so they enter them again (SSN included); the list of forms with Signed, Next and not yet; "Carry on with form 4".

## 3 · The DocuSign route
- **3a** DocuSign's window sits inside Pam's screen, in its own edge, captioned "Shown by DocuSign" with its address, under Pam's bar (close, the form's name, Pause, "Form 3 of 112" and progress). Under it, one line says what is typed there goes to DocuSign, not Pam, and a help link. Pam's own Sign and Next are not drawn here: DocuSign has its own.
- **3b** When DocuSign finishes they are back in Pam: "DocuSign has it", the next form named, **Next form**, "Pause here".

## 4 · Done
**All 112 signed**: the programs have their forms (9 programs, 112 forms). Pam keeps no copies, so the main action is **Save my copies** (to the phone or to their own email), with a plain line that once they leave the screen the copies are not in Pam. A last card confirms their details are cleared.

## Questions for Will, Lena and Piper
- Pam keeps no copy of a signed form, because the form contains the SSN. That means the member's only copy is the one they save at the end. Is that what Will wants? (A copy sent to the member's own email, or one kept by DocuSign on that route, are the alternatives.)
- Do programs get the form from Pam, or only from DocuSign on the DocuSign route? The pictures say "sent to the program" either way.
- "Skip for now" and "Undo this signature" are my additions; Will may not want either.
