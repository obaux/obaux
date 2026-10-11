# Draft post: Using Pam in your language

**For Wren to register** (slug suggestion `your-language`; topic: getting started). Words by Sage, for Will to sign.
Facts from the app (keys in brackets) and A24/A25. Answers the gap phrases: "change my language", "en español".

---

**Title:** Using Pam in your language

**Who it's for:** Everyone

**Summary:** The seven languages Pam speaks, how to pick yours, and what changes when you do.

**Lead:** Pam's words and buttons will be in the language you choose.

## The languages
English · Español · Português (Brasil) · 简体中文（普通话） · 繁體中文（廣東話） · Русский · العربية (`language.*`)

## Pick it when you join
- One of the first screens asks you to choose a language. (`onboarding.language.title`)

## Change it any time
- Open Profile, then tap Language. (`profile.menu.language`)
- Pick yours. Pam changes straight away.

## What follows your choice
- Every screen in the app.

## Good to know
- These Support pages are in English for now.
- If a word in your language looks wrong, call Pam and tell us. We fix it.

---

**Check before it ships:**
- No line about texts. Texts to members are not switched on yet (`texts_live` off, D-481), and the sign-in code comes
  from Supabase Auth's own template, which may not follow the language (Mira, 11 October). Add "The texts Pam sends
  you come in your language too" the day texts go live, if the code text follows.
- The lead differs from the app's `language.intro` ("words, buttons and texts") for the same reason; that string is
  a FINDING for Lena.
- "If a word looks wrong, call Pam and tell us. We fix it." matches the feedback process in `docs/copy-changes.md`
  ("fail first, then fix", D-430). Mira advised keeping it.
- Each language name is written in its own language, as the app does.
