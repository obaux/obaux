# Fill once, sign many: the member's side (pictures only, 390px, light and dark)

## Second round: Will's four notes on card a85 (14 October, 04:31)
1. **One banner style, the place page's.** Every note card (the ones that had the left accent edge) now uses the look of the place page's confirmed-booking card: **`VisitCard`** (`@pam/ui/VisitCard`, D-273 and D-281): an Astryx `Card`, padding 5, on `--color-background-green`, no edge border, a 40px disc in the card colour with a green mark, a bold 16px line and 16px body text. `VisitCard` itself is a booking card (eyebrow, day, time), so the mock draws the same look as a small `Calm` helper; if Will likes it, the build is one shared note component made from `VisitCard`'s styles, not a new look.
2. **Main buttons fixed to the bottom on every screen.** Every screen uses `Page`'s footer (the strip pinned at the bottom with the page fading out above it, clearing the home indicator through `env(safe-area-inset-bottom)`), so content scrolls under it: Start signing, Looks right: start, Sign this form, Next form, Carry on, Save my copies. The DocuSign screen has no Pam button: DocuSign draws its own Sign, so the pinned strip holds the help link. See 1a and 1b (the SSN scrolled into view, the form fading under the button).
3. **All 112 signed:** the two notes sit close together (8px apart), then the Your copies card below them.
4. **The cleared note, in Sage's words (mock words; she signs them when forms are built).** One per route, because "no longer" is only true where Pam had the details for a while. **4a, Pam-only route:** "Not stored in Pam. The name, birth date and Social Security number you typed for this form are no longer stored in Pam." **4b, DocuSign route:** "Not stored in Pam. Pam never had the name, birth date and Social Security number you gave for this form. They went straight to DocuSign." ("you typed for this form" because Pam does keep the account's first name.) On 4b the copies card says DocuSign sends the member their copies; Pam has none, and the way on is Back to Home (stand-in words).

**For the build (not in the pictures):** the app's `body` carries 72px of bottom padding for the HelpBar (`globals.css`), which lifts a pinned `Page` footer 72px off the bottom once a page is scrolled to its end. These pictures were taken without it. Screens that pin a footer need it dropped, or the button rises when you reach the end.

For Will's card, asked 14 October 04:03 (relayed by the merge desk). Nothing is built or shipped. The pictures were drawn with Pam's own components (SubPage, BigButton, TextField, TextLink, Badge, Card) in a throwaway page, kept as `mock-source.tsx.txt` so they can be redrawn. **All words are stand-ins: Sage writes the real ones (A29).** Names are examples (Marcus Example, Example Food Pantry). The SSN shown is made up.

`all-light-390.png` and `all-dark-390.png` show every screen at once. Each screen is also on its own, `-light-390.png` and `-dark-390.png`.

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
