# Putting PAM on the web

PAM ships to the App Store and Google Play, and it still needs a web address.
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

## What this does not cover

Store submission. Capacitor wraps this same build; `cap add ios` and
`cap add android` have never been run, so "it wraps cleanly" is still an
assumption. That is the last unproven claim in the foundation.
