# Weekly pass: Profile, points and Privacy (22 October 2026)

Iris, the Thursday pass, covering the parts of this flow that changed since 15 October:

- Profile's rows and cards, with the badge under the name (D-612; `797327da`, `d91c8920`);
- "Maker" for "Craftsman" (`2f3528e0`);
- the program line in What others can see (`8295abad`);
- Privacy's What we keep, and Who else gets your information (`29e28a6b`, `a20e9f05`);
- Arabic counts (`4bec53ff`).

## The flow and the person

| Person | Starts on | Trying to |
|---|---|---|
| A member, a case manager and a program lead | Profile | See their points and badge, find what others can see about them, and read what Pam keeps |

## How

- **App:** the `build:e2e` app of `main` at `6773c9c4` (b77), on 127.0.0.1. Every other host was
  refused.
- **Data:** made-up people, any phone a 555 number. I never signed in to live, and no account was
  made.
- **Setup:** Playwright in Chromium with touch.
- **What I ran:**
  - every role, on 4 screens (`/profile/`, `/points/` for a member, `/legal/privacy/`,
    `/privacy/`);
  - at 390×844 and 320×568, light and dark;
  - in English, Spanish, Russian (with a long hyphenated first name) and Arabic.
- **50 page loads** in all. On each I measured sideways scroll, cut text, targets under 48px and
  text under 16px. I also tapped each Profile row and card away from its words.

## What happened

| Task | Taps | Result |
|---|---|---|
| Profile → Your points (the badge card) | 1 | Opens `/points/`. A tap in the card's middle works. |
| Profile → What others can see | 2 (Legal → What others can see) | Opens `/legal/privacy/` |
| Profile → Privacy | 2 (Legal → Privacy) | Opens `/privacy/` |
| Profile → Get text alerts (the promo card) | 1 | A member goes to `/reminders/`, staff to `/alerts/` |

## Findings

### Stops someone

None.

### Slows someone

None.

### Polish

| # | Screen | What happened | What the person would expect | How sure |
|---|---|---|---|---|
| P1 | Privacy, Spanish (`/privacy/`) | **The page mixes "tú" and "usted".** Its first card says "Tu guía es la persona que **te** invitó". The headings below say "Quién más recibe **su** información" and "Lo que **usted** puede hacer", and What we keep says "**Su** nombre…". What others can see is all "tú" ("Un programa ve **tu** nombre"). | One voice on a page, and across Profile's legal screens (`shots/2026-10-22-profile-privacy-es-320.png` shows the "tú" card above the "usted" sections). For Lena. | Sure |
| P2 | Profile, all roles | **Small text under the name and in the stat tiles:** "Member" 15px; "Points", "Places saved" and "Connections" 13px; "Your badge" 12px; "Coming soon" 12px; the language code "EN" 12px. | 16px or more for words a member reads. The numbers themselves are large. | Sure (measured) |
| P3 | Your points | **The badge names are 13px and "Not yet" is 12px grey**, on 12 badges. That's hard to read in dark mode (`shots/2026-10-22-profile-points-maker-en-390-dark.png`). | The badge's name readable at a glance. | Sure (measured) |
| P4 | Profile, Russian, 320 | **A long first name crowds the stats.** "Александра-Валентина" wraps at the hyphen in large bold type, and its column ends against "Баллы" / "Сохранённые места" with almost no gap. "Сохранённые места" also wraps to two lines (`shots/2026-10-22-profile-member-ru-320.png`). | The name and the numbers clearly apart. Nothing is cut and nothing overlaps; it's just tight. | Sure |
| P5 | Privacy's section chips | **The jump chips are 40px tall** ("Что мы храним" 147×40, "Кто ещё получает вашу информацию" 302×40). The row scrolls sideways, and the third chip is cut at the edge, which does show there's more. | 48px tall. | Sure (measured) |
| P6 | Privacy, all languages | **The page is long:** 7,446px in English (about 9 screens at 390×844, 13 at 320×568) and 7,752px in Spanish. The ten chips at the top help. | Fine as is; noted for the next time words are added. | — |
| P7 | Profile, member | **The "Get text alerts" card says "Coming soon" but opens the agree screen**, which asks the member to agree to texts now (with `texts_live` off in my stub). | Either the card leads to a screen that says the same, or it isn't a door yet. For Sage. | Fairly sure; depends on `texts_live` |

## What worked

- **Every Profile row is a full-width target.** A tap on the icon, the chevron or the space under the
  words opens the row (288×64 at 320 wide; the words alone measure 24px tall, but the row takes
  the tap). The badge, Connections and Get text alerts cards open from a tap in their middle.
- **The badge under the name (D-612):**
  - The role ("Member", "Case manager", "Program") sits under the name, with the whole width for the
    name.
  - A long Russian name wraps instead of being cut.
  - No screen scrolled sideways in any role, size or language.
- **"Maker":** the badge list says "Maker" (Spanish "Oficio", Russian "Мастер", Arabic "صانع"), and
  "Craftsman" appears nowhere.
- **What others can see** says the new program line in full: "A program sees your first name and
  what you write to them, even before you plan a visit. It sees more once you sign up, sign its rules
  or plan a visit there." (Spanish matches.)
- **Privacy:**
  - "Last updated 17 October 2026" is shown.
  - What we keep and Who else gets your information carry the signed words, in all four languages.
  - Its headings are a real list of ten: Your guide … Talk to a person.
- **Arabic counts on Your points:** two points read "نقطتان" with no digit, and 250 reads "250
  نقطة". Both are right.
- **The Russian title "Конфиденциальность"** fits at 320 (288px wide, not cut).

## Not covered

- **The full "A program can see:" list** (`transparency.program.*`, including the new "When you save a
  new place — not which one"). It renders only in the sign-up flow (`JoinScreen`), not under Profile.
  It belongs to the sign-up flow's pass.
- **Arabic counts on Home, Explore and Trips with real numbers.** My stub had no people, places or
  trips, so those screens showed their empty states. Only Your points was checked with numbers.
- **A real screen reader.** That needs Will's phone.

Iris
