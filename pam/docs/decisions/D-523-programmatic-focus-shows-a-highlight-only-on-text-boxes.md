# D-523 — Programmatic focus shows a highlight only on text boxes

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-focus-text-boxes`

**Decided by:** Will, via the merge desk (11 October 2026, 04:17 UTC): "Modals and section links (from policy pages) are highlighted. That's not intended behavior. Let's rewrite the input field rule to only mean text boxes."

**Replaces** the focus line of D-411 (Will, 9 October: "why are buttons automatically selected on modals … Those should not be auto selected. Only input fields ready to type"). D-411 fixed which element a dialog focuses (`landFocus`: its content, not the first button) but left the global `:focus-visible` ring on, so that content, a sheet, the photo viewer and a contents link's section still drew a ring whenever the browser counted the focus as keyboard-driven.

**The rule.** Focus a script puts somewhere shows a visible highlight only when the target is a text box (input, textarea, contenteditable), as before: the ring on the field's frame. Anything focused so a screen reader lands in the right place is `tabindex="-1"` and not a control, and shows no ring **in any input mode**, mouse or keyboard:
- a dialog's or sheet's content (`landFocus`), the dialog or sheet element itself, the photo viewer;
- the section a Privacy or Terms contents link jumps to (its heading).

In `globals.css`, one rule after the global `:focus-visible`: `[tabindex='-1']:not(input, textarea, select, button, a[href], [contenteditable='true']):focus-visible, dialog:focus-visible, [role='dialog']:focus-visible, [role='alertdialog']:focus-visible { outline: none }`. Buttons and links keep the brand ring under `:focus-visible` when somebody Tabs to them (`theme.spec`'s "the focus ring is the brand" stays). §12's "never hide the focus ring" is about things that can be pressed; this is not one.

**Tests.** `e2e/focus-text-boxes.spec.ts`: Privacy and Terms contents links (mouse and keyboard; Tab on from there still rings), a sheet (the place's hours drawer; mouse and keyboard), a confirm dialog (remove a policy; mouse and keyboard), a search box focused on arrival still shows its field highlight, and in each Tab then rings the first button. `messages.spec.ts` adds the photo viewer in both modes. With the rule taken out the keyboard sheet and keyboard confirm-dialog tests fail.

**Checked, no gap (Wren's note, 04:35).** On the help site Astryx's own `outline-style: none` beat the global `:focus-visible` and left no focus at all. In the app a Tab through Profile shows a 3px ring on every control: the header buttons, the feature tiles, the list rows, Sign out and the tab bar. (A first reading showed 0px: the ring grows in over a moment on some Astryx controls, so the test reads it once it has.) `focus-text-boxes.spec.ts` keeps that true. No stylesheet change was needed.

**Not part of this.** Wren is doing the same for the help desk's "On this page" on the website; this is the app's stylesheet only.

**What a later session might reverse.** Nothing about Tab: a control still rings.
