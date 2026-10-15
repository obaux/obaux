# A27 — Text sizes: the page is 16px, components say their own, nothing under 12px (11 October 2026, Will)

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-a27-text-size`

Wren's token list (10 October) said Foundations promised 16px body text and the theme's own body role is 14px. Counted over 120
role screens in Storybook, about 2,300 pieces of text: 874 (38%) are under 15px, 1,400 are 15px or more. Asked whether to raise
the theme (body and label to 16px, supporting to 15px) or keep the sizes and write down the exceptions, Will (11 October,
Control Room, a48): "Leave as is. Make exceptions. Update rules."

Nothing on screen changes. This writes the rule down the way the code already is.

## The rule now

**The page is 16px.** `body` is 16px (`--pam-body-size`, the `--pam-body-text-mobile` token, `A11Y.bodyTextMobilePx`, and the
e2e check "body text is at least 16px on mobile" that reads it). Text typed into a field is 16px as well (smaller, and an
iPhone zooms the page).

**Components say their own size, by what the text is for:**

| What it is | Size | Examples as built |
| --- | --- | --- |
| Screen title | 34px (tab screens 28px) | `SubPage`, `LargeTitleHeader` |
| Section and card headings | 20–22px | "Pick a service", card names |
| Buttons and rows | 17–18px | `BigButton` (56px high), `MenuList` row labels |
| Reading text | 16px | the Privacy notice and Terms, policy text, anything a member reads to decide or sign |
| Supporting lines | 15px | a line under a row, the invite line on Sign in, the quiet legal links |
| Component body and labels | **14px** | a field's label and its helper line, a list row's meta (distance, hours), a link inside a card, a chip, a compact `Button` |
| Captions and metadata | **12–13px** | the tab bar's labels (12), the date and time on a card, a tag or a language code, a stat's label ("Points"), "1 of 3" |
| Anything under 12px | **never** | |

**Where text must stay larger** (16px or more, whatever else a component does):
- the screen's action: `BigButton` (17px), and the field somebody types into (16px);
- titles and headings;
- anything a member reads in order to decide or to sign: policies, the legal pages, a notice that says what went wrong
  and what to do;
- Sign in and joining: what a person acts on, the title, the number field and the button, is 16px or more. (The field's
  label stays 14px as built: see "Legal and consent text" below.)

**Legal and consent text runs smaller and quieter than the screen's content** (Will, 11 October, Control Room, a52: "leave it.
Legal texts should always run smaller and less emphatic."). That covers the consent sentence on Sign in and joining ("Pam texts you
a code to sign in…", 14px), the Privacy, Terms and About links in the footer (15px, the quiet link style), and legal notes
under a form. They are never raised to match the reading text around them, and they never carry the screen's one action. This
is an exception to "Sign in and joining stay larger", which is about what a person acts on. It is a rule about size, not
wording: the consent text is the carriers' reviewed words and does not change. (The *legal pages themselves*, Privacy and Terms,
are reading text and stay 16px.) Will's answer came to a question about raising Sign in's field label and the consent sentence to
16px; he left both as they are, so the label ("Your phone number", 14px) is also kept as built.

**Where smaller is allowed:** metadata and captions (12–13px), and component labels and meta lines (14px), **as long as
nothing a member needs in order to act is carried by a small line alone**: the next step is a heading, a button or a reading
line, never only a caption.

## Where this contradicts the original

A23 (9 October) said: "16px body text on mobile. … Nothing a member has to read is smaller than 15px; supporting lines stay
15–17px." That is **replaced** by the table above. The 16px base, the floor for typed text and for reading text, is A23's and
stands. What goes is the claim that everything a member reads is 15px or more: the theme's body and label roles are 14px and
its supporting role 12–13px, and the screens are built that way. The SOP's §2.5 and §12 line "16px body text on mobile" reads as
the page's base size, not the size of every component.

## What did not change

- 48px minimum touch targets, 56px primary and secondary buttons (D-239).
- AAA contrast for body text; AA for large text.
- Text scales to 200% without breaking the layout (§12).
- The 16px base and the e2e check that reads it.
- The words that must never appear, in any size.

## As built, and not changed here

Noted so a later job can decide; nothing is done in this amendment (it is docs only):
- One caption was **11px**, the "Your badge" label on the Profile badge tile (`ProfileCards.tsx`). The rule says nothing under
  12px, so it is 12px (11 October).
- On Sign in, the number field's label and the consent sentence are 14px. Decided, not a gap: Will left both (a52, above).
- Some links a member acts on ("Ask a question before you go", a program's phone number) are 14px. They are 48px targets
  (§2.5), which is the rule that protects acting on them.
