# Join and Sign in from an invite — before and after (13 October 2026)

390px wide, built app, Supabase stubbed. `before-` is `main` at 96f27a77; `after-` is
`claude/pam-join-first-time-wording` (D-563, with Dot's LanguageField, D-561).

- Join › About you, light, dark and Arabic: `1-closed` (code behind the question), `2-language-list`
  (the dropdown open, English tag first), `3-code-open` (after the link).
- Sign in from an invite (`/signin/?invite=…&as=member`), light and dark: title "Join Pam" and Will's
  W6 line.

The code question uses Will's words ("Did someone invite you via code?" / "Click here"); Sage's
alternative ("Did someone invite you with a code?" / "Enter your code") is one commit on top, on card a82.
In Arabic the new lines show in English until Lena translates them.
