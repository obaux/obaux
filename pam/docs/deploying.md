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
3. **Environment Variables**, for Production and Preview both:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://shobqzuhicoiymtumiaz.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the publishable key from Supabase → Project Settings → API |
   | `NEXT_PUBLIC_APP_URL` | the URL Vercel gives you, e.g. `https://pam.vercel.app` |
   | `NEXT_PUBLIC_SUPPORT_PHONE` | `+12673095265` |

   The publishable key is designed to ship in browser code and is protected by
   the access rules in the database, which the test suite verifies. The service
   key is a different thing and belongs nowhere near this list.
4. Deploy. Every push to a branch gets its own preview URL; `main` becomes the
   production one.

## After the first deploy

- Set `NEXT_PUBLIC_APP_URL` to the URL you actually got, and redeploy. Until it
  is set, invite links fall back to the origin the page was served from — right
  in a browser, wrong inside the phone app, where the origin is a local file
  server.
- Add the same URL to Supabase → Authentication → URL Configuration, so sign-in
  redirects are accepted.
- When a real domain exists, add it in Vercel, update `NEXT_PUBLIC_APP_URL`, and
  update Supabase. Links already sent keep working as long as the old URL
  redirects.

## What this does not cover

Store submission. Capacitor wraps this same build; `cap add ios` and
`cap add android` have never been run, so "it wraps cleanly" is still an
assumption. That is the last unproven claim in the foundation.
