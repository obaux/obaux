---
name: pam-support-post
description: Turn information Will gives into a new post (or an edit to one) on PAM's public Support site (pam/apps/site). Use whenever Will pastes or describes how something in PAM works and wants it on the public site, says "add a support post", "put this on the website", or asks to change the Support or Home pages. Covers writing it, registering it, checking it in Storybook's Website journey, and the record.
---

# Writing a PAM Support post

Will throws information at you; you write the post. The site is `pam/apps/site`
(D-433, D-437): a static Next export on the app's design system. Members read it
to learn how a complicated system works, so it is plain, short and true.

## 1. Before you write

- **Check it is true of the app.** Read `pam/STATUS.md` and the relevant
  `DECISIONS.md` entries. If Will's information describes behaviour that is not
  built or not live, say so to Will *before* publishing, and add it to
  `pam/docs/before-launch.md` — the first post did exactly this (D-433).
- **Write for someone who hasn't used a phone in 8 years.** Short sentences,
  second person for members, no jargon without a gloss. Say "people coming home";
  never "prisoner", "ex-offender", "inmate" or conviction details (a test checks
  the content, and CLAUDE.md forbids them everywhere a user can read).
- **Don't invent.** No support email, phone number, date or promise that Will
  didn't give. Pointers that only made sense in the conversation ("see question
  2") get rewritten so the sentence stands alone.
- **Quote the app exactly** when quoting it (e.g. `privacy.s.*` in
  `packages/config/src/locales/en.json`), and verify the quote.

## 2. Add the post (three small edits)

1. `pam/apps/site/src/content/posts.ts` — a new entry at the **top** of `POSTS`:
   `slug`, `topic` (`members` | `case-managers` | `programs`, from `topics.ts`),
   `title`, one-sentence `summary`, `updated` (today, ISO), and `keywords` —
   words people might type that the title doesn't say (they feed Support's
   search).
2. A body component `pam/apps/site/src/content/<PascalName>.tsx`, modelled on
   `CaseManagerAssignments.tsx`: Astryx `Heading`, `Text`, `VStack`; a lead
   paragraph, then headings. Structured content (a table, a list of steps) goes
   in a data file beside it, like `assignments.ts`, so a test can read it. A
   table uses `AssignmentsTable`'s pattern: a real `Table` on wide screens and
   stacked cards under 720px.
3. Register it in `pam/apps/site/src/content/bodies.tsx`.

The route, the Support index (topic cards, popular articles, search) and the
Storybook journey all read those two lists. Nothing else to touch. If the post
needs a new topic, add it to `topics.ts` (and a blurb).

Style rules are the app's: Astryx components only, `stylex.create()` + `xstyle`,
no inline `style`, no `<div>`, no raw hex or px where a token exists.

## 3. Check it

From `pam/`:

- `pnpm --filter @pam/site typecheck`, `... test`, `... build`.
- `pnpm --filter @pam/web build-storybook` (the script sets `PAM_STORIES=1`; a
  hand-run `storybook build` without it renders the site unstyled). Serve
  `apps/web/storybook-static` with `python3 -m http.server`, open
  `iframe.html?id=website-journey--post` (choose the post in the controls) and
  `...--support`; look at 1280px and 390px, light and dark.
  Check the new post appears under its topic, in Popular articles, and in search.

Changing the site's title, description, tagline or social image? Edit
`apps/site/src/lib/share.ts` (words) or `apps/site/social/preview.html` (picture,
then `node social/render.mjs`), and check **Website › Share and icon**, including
the compact card — everything that must be read stays in the central square.

## 4. Record and ship

- Extend `apps/site/test/content.test.ts` if the post has structured data.
- Session log in `pam/docs/sessions/`, a line in `pam/STATUS.md` (public site
  section), `pam/CHANGELOG.md` if user-visible. A `DECISIONS.md` entry only for a
  choice someone could question. Claim any D-number in `pam/docs/allocations.md`
  first (see `pam/CLAUDE.md`).
- Commit and push to the working branch. The `pam-site` Vercel project builds a
  preview for the branch. **Production is `main`; do not merge to `main`
  unless Will asks.**
