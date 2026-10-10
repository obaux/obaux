# Putting Pam on the web

Pam ships to the App Store and Google Play, and it still needs a web address.
Every invite arrives as a link in a text message, and that link has to open
something for a person who has not installed anything yet. So the web build is
not scaffolding thrown away at launch — it is the front door.

Vercel's free tier hosts it. Nothing here commits the project to Vercel: the
build is a folder of static files, which any host can serve.

## One-time setup

1. Sign in to vercel.com with the GitHub account that owns this repository.
2. **Add New → Project**, pick `obaux/obaux`, and set:
   - **Root Directory**: `pam/apps/web`
   - **Framework Preset**: Other — `vercel.json` in that folder carries the real
     build commands, because the build has to run from the monorepo root.
3. Deploy.

**There is no environment-variable step.** There used to be, and it cost an
afternoon: the Supabase address and key are compiled into the app at build time,
they lived only in a gitignored `.env.local`, and a deploy without them produced
a site that looked perfect and failed silently at the one screen everybody
starts on. They are checked in now (`apps/web/src/lib/project.ts`), which is
safe for the reasons written in that file and guarded by a test.

Every push to a branch gets its own preview URL; `main` becomes the production
one.

## After the first deploy

- **Add the URL to Supabase → Authentication → URL Configuration**, or sign-in
  redirects are rejected. This is the one link between the two services that
  still has to be made by hand, because only Supabase can be told which
  addresses it trusts.
- If the URL is not the one in `apps/web/src/lib/project.ts`, change it there
  and push. Invite links are built from that value, and a link in a text message
  has to point at the address that actually answers.
- When a real domain exists, add it in Vercel, update `NEXT_PUBLIC_APP_URL`, and
  update Supabase. Links already sent keep working as long as the old URL
  redirects.

## The public site (`apps/site`)

Pam's public website (Home and Support, D-433) is a second, separate Vercel
project from the same repository, so it can have its own address and nobody who
reads a support page is ever near the app's sign-in code.

1. Done once, 10 October (D-437): Vercel project **`pam-site`**, root
   `pam/apps/site`, framework Other (`vercel.json` carries the build). New
   project? **Add New → Project**, pick `obaux/obaux`, set the same.
   **Turn Vercel Authentication off** (Settings → Deployment Protection): it is
   on by default and puts a Vercel login in front of a public site.
2. No required environment variables. It never talks to Supabase. When the site has its own domain, set `NEXT_PUBLIC_SITE_URL` (the social preview's absolute address, `apps/site/src/lib/links.ts`). Its "Sign in",
   "Privacy" and "Terms" links point at the app (`apps/site/src/lib/links.ts`,
   `NEXT_PUBLIC_APP_URL`, the same default as `apps/web/src/lib/project.ts` —
   change both when the app's address changes).
3. Locally: `pnpm --filter @pam/site dev` (port 3100), `pnpm --filter @pam/site build`.

New support posts: add an entry to `apps/site/src/content/posts.ts` and a body
component beside `CaseManagerAssignments.tsx`, then register it in
`apps/site/src/app/support/[slug]/page.tsx`.

**joinpam.org (10 October).** Pam's domain: the site is `joinpam.org` (`www` redirects to
it), the app is `app.joinpam.org`, email sends from `mail.joinpam.org`. The site's
`vercel.json` forwards invite links `joinpam.org/j/<CODE>` (and with a trailing slash) to
`https://app.joinpam.org/j/<CODE>` with a temporary redirect; `apps/site/test/redirects.test.ts`
checks the rules, since a local build does not apply them. `NEXT_PUBLIC_SITE_URL` defaults to
`https://joinpam.org` (the share preview's absolute address) and `NEXT_PUBLIC_APP_URL` to
`https://app.joinpam.org`; set either at build time to point a preview elsewhere. Unverified
from here: whether Vercel passes a query string through the invite redirect.
CI builds the site and runs `apps/site/scripts/a11y.mjs` on it (axe, light/dark, desktop/phone/320px).

## What this does not cover

Store submission. Capacitor wraps this same build; `cap add ios` and
`cap add android` have never been run, so "it wraps cleanly" is still an
assumption. That is the last unproven claim in the foundation.
