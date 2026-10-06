# Changing Pam's domain

Every link Pam builds to send somewhere else — an invite link (D-254, D-258),
the new link in an invite email and its logo (D-263), the picture a phone
shows when an invite link is pasted into a text (D-263), anything in a text —
comes from **one value**: `APP_URL` in
`apps/web/src/lib/project.ts`.

```ts
export const APP_URL = (
  process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://web-ten-umber-88.vercel.app'
).replace(/\/+$/, '');
```

`inviteLink()` in `apps/web/src/lib/appUrl.ts` is the only place an invite
link is put together, and it reads `APP_URL`. No screen writes a domain of its
own. `lib/project.test.ts` and `lib/appUrl.test.ts` fail if `APP_URL` is ever
`localhost`, a `capacitor://` origin, or ends in a slash.

## To move to a new domain

1. In Vercel, add the domain to the `web` project.
2. Set `NEXT_PUBLIC_APP_URL=https://the-new-domain` for Production (and
   Preview if previews should link to it), then redeploy. That alone switches
   every new link.
3. Change the checked-in fallback in `project.ts` to the new domain too, so a
   build with nothing configured — the Capacitor app, a fresh preview — is
   right as well.
4. **Keep the old domain answering**, redirecting to the new one. Links
   already sent (an invite lasts 30 days, and an expired one can ask for a
   new one by email) carry the old
   domain; a redirect keeps every one of them working. Vercel does this from
   the domain settings: add the old domain and set it to redirect.
5. Update the two URLs the SMS carrier registration names
   (`docs/sms-campaign-samples.md`: the privacy and terms pages). A changed
   policy URL may need the campaign resubmitted.
6. Supabase: add the new domain to Auth → URL configuration (site URL and
   redirect allow-list), or phone sign-in redirects will be refused.

Link previews are cached by the apps that fetch them, so an invite sent
before the move may keep showing the old preview for a while; the link
itself still works through the redirect.

Nothing in the database stores a domain: an invite stores its code, and the
link is built from the code when it is shown.
