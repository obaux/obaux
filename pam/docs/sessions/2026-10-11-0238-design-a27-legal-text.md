# 2026-10-11 — design a27 legal text

**Branch:** `claude/pam-design-a27-legal` · **Lane:** design system & Storybook (Dot)

## What changed

Will (a52, 11 October): "leave it. Legal texts should always run smaller and less emphatic." Docs only; no screen changes.
- A27 gains a "Legal and consent text" paragraph with his words: the consent sentence, the footer's Privacy / Terms / About links
  and legal notes run smaller and quieter than the screen's content, and are never raised to match it; it is about size, not
  wording (the consent text is the carriers' reviewed words). The legal pages themselves are reading text and stay 16px.
  "Sign in and joining stay larger" now covers what a person acts on: the title, the number field and the button.
- A27's "As built" no longer lists Sign in's two 14px lines as a gap (decided); the 11px caption line says it is 12px.
- Typography says the same.

## What was wrong, and what missed it

My A27 listed Sign in's label and consent sentence as things to raise; the rule it wrote ("Sign in and joining stay larger") was
broader than the intent. Will's answer narrows it.
One call to flag: Mira's instruction said the "larger" group covers "its label if it's the only label". Will's "leave it" answered a
question that covered the label and the consent sentence together, so I kept the label at 14px as built and did not list it as
something that must be larger. If he meant to raise only the label, it is a one-line change and the rule gains the label.

## Decisions made

None new: A27 is Will's.

## Verified

`build-storybook`. Docs only.

## Left undone

Nothing.

## Needs a human

Nothing, unless Will wants the field's label raised after all.
