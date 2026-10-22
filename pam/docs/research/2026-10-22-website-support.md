# The website's Support, signed out (weekly pass, 22 October 2026)

Iris. One flow of the Thursday pass: the public website's Support, as it changed this week:

- the search box (`1470e6a4`, Sage's words at `fa0481ce`);
- the Updated line on eleven posts (`afdbd96f` / `90b8a860`);
- the rules post's two pictures (`d0f77a49`);
- "What others can see" (`a20e9f05`);
- the new post "When a program books a visit for you" (`275f7160`).

## The flow and the person

A member, signed out, on a phone, looking for help in their own words: "my text didn't come", "how do
I cancel a visit", "something didn't go through". The start is `/support/`.

## How

- **Build:** the site built from main at `6773c9c4` (`pnpm build`, a static export), served on
  127.0.0.1. Every other host was refused, and none was asked for.
- **What was never touched:** no sign-in, and nothing sent.
- **The setup:** Playwright in Chromium with touch, at 390×844 and 320×568, light and dark. The site
  is English only (apart from `/en/about-pam`), so Spanish and Arabic were tried as search words, not
  as page languages.

## What happened

| Trying to | Steps | Taps |
|---|---|---|
| Find why a text didn't come | Tap the box, type "my text didn't come", tap the suggestion "Texts from Pam: which ones, and why one didn't come", then tap it again in the list | **3** and typing (2 expected; see S1) |
| Find how to cancel a visit | Tap the box, type "how do I cancel a visit", Enter, tap "Planning a visit" (first of 5) | 2 and typing |
| Find what to do when something didn't go through | Tap the box, type it, Enter: 4 results, the first "When something isn't working, start here" | 2 and typing. There's no post of that name yet (see W1). |
| Browse | "Most asked", then six topics, each with its posts | 1 tap from the Support home to a post in Most asked |

Search, on the 320 screen:

| Typed | First result | Results |
|---|---|---|
| my text didn't come | Texts from Pam | 3 |
| how do I cancel a visit | Planning a visit | 5 |
| cancle visit (a typo) | Planning a visit | 5 |
| cancelar una visita (Spanish) | Planning a visit | 5 |
| stop texts | goes to the saved phrase "how do I stop the texts", then Texts from Pam | 2 |
| who can see my info | What your guide, a program and others can see | 6 |
| something didn't go through | When something isn't working, start here | 4 |
| إلغاء زيارة (Arabic) | — | "No results… We do not have an article for that yet.", then the topics |
| xyzzy plumbus | — | the same, with the topics and "Still stuck?" |
| (empty, Enter) | stays on Support | — |

## Findings, ranked

### Stops someone

None.

### Slows someone

| # | Screen | What happened | What the person would expect | How sure |
|---|---|---|---|---|
| S1 | Support search, a suggested post | Tapping a suggested **post** ("Texts from Pam…", 264×116) doesn't open it. It runs a search for the post's title: `?q=Texts from Pam: which ones…`, with "15 results". The person then taps the same post again, first in the list. Enter on the highlighted suggestion does the same. | A suggestion that is a post opens that post. | Sure: seen on tap and on Enter. |
| S2 | Support search, after Enter | **The box empties** once the results show. After "No results for 'cancle visit'" the person can't fix one letter; they have to type it all again (`shots/2026-10-22-site-search-none-320.png`). Reloading `?q=` puts the words back, so it's only the in-page search. | The box keeps what was typed. | Sure. |
| S3 | Support search, with a screen reader | Two live regions speak at once: "2 results for cancel" (the page) and "1 result" (the suggestions list). The numbers disagree. Someone listening hears two answers to one question. | One count, said once. | Sure about the two regions; not checked with VoiceOver or TalkBack (needs Will's phone). |

### Polish

| # | Screen | What |
|---|---|---|
| P1 | Support home and every post | **Much of the text is under 16px.** On the Support home, 43 pieces of text are 14px, including the "Most asked" rows and every post's summary. On posts, captions and notes are 12–14px (for example 88 pieces at 14px on "What others can see"). |
| P2 | Every page's footer | The "write to us" email link is a 118×20 target. |
| P3 | Search in another language | An Arabic search says "No results… We do not have an article for that yet." It doesn't say the help is in English, or point to "Your language". (A Spanish search happened to work, because "visita" matched.) |
| W1 | `/support/something-didnt-go-through/` | **For the desk:** this post isn't on main. D-618's `refused` alert has Get help opening it (Sage `98875861`), so if D-618 lands before the post, Get help opens a 404. Today that address gives the host's 404. |

## What worked

- **Search finds the right post first** for plain questions, a typo ("cancle") and a Spanish phrase.
  "Stop texts" is caught by a saved phrase.
- **The box is easy to hit and to read.**
  - The pill is 54–60px tall, and a tap anywhere on it, even its edge, focuses the box.
  - Its name is "Ask a question in Support".
  - The arrow keys move through the suggestions (`aria-activedescendant`), and Clear search has a
    name.
- **"No results" isn't a dead end.** It says so plainly and shows the six topics and "Still stuck?"
  under it.
- **The Updated lines are there**, with real dates: Texts from Pam and Messages, 18 October;
  Planning a visit, What others can see and the new booked-visit post, 17 October; Signing a
  program's rules, 16 October.
- **The rules post's two pictures load** (780×1688, shown 246×530 at 320), each with a full
  description.
- **Every other post's picture loads too** once scrolled to; they load as the page scrolls.
- **Nothing scrolls sideways** at 320 or 390, in light or dark.

## Not covered

- **The live site:** this was the local build of main only.
- **A real screen reader** (S3 needs Will's phone).
- **Pages in other languages:** none exist yet.

Iris
