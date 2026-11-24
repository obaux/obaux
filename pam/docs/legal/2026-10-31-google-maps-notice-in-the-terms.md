# Google Maps in Pam's Terms: what Google requires, what is missing, the English for Will to sign

**Written by:** Lena (Languages & legal), 31 October 2026, for Mira and then Will. **Asked:** Mira, 21:00 UTC, after reading Iris's research
(`docs/research/2026-10-31-real-opening-hours.md`, section 1).
**Status:** the English in section 4 is a held draft; nothing is in the bundles, nothing is translated, and `legal:date` is not run. Will signs it (A29: Terms are his),
then I translate it into six languages and it ships with the date of the day it goes live.

## The short version

1. **Yes, the notice is missing.** Google Maps Platform Terms of Service §3.2.2(a)(i) says an app's own terms must tell people it includes Google Maps
   features and content, and that using them is subject to two Google documents. Pam's Terms say nothing about Google; Pam's Privacy page names Google
   twice (`sharing.p5`, the Trips map; `sharing.p7`, street search) but that is a different duty.
2. **It is a Terms paragraph, not a Privacy line.** What Google gets from a member is already on the Privacy page and still true (section 3). Nothing new is
   sent to Google by this change, so no new Privacy line is needed.
3. **The street search's Google mark is built the way Pam's team recorded Google's rule on 13 October.** I could not read Google's current Places
   attribution page from here (see "What I could and could not read"), so I cannot say it is current; I can say what the Terms I did read require and that
   the mark meets that, and I list the two small things someone with access should look at.
4. **One guard added** so this cannot be forgotten again: wherever Pam uses a Google Maps Platform host, the Terms must hold Google's two addresses, in every
   language. It waits on Will's signature the way the Privacy lines do (`test/third-party-hosts.test.ts`).

## 1. What Google requires (read on 31 October 2026)

Read from Google's own pages, fetched with `curl` from `cloud.google.com` (the only Google host this session can reach; `developers.google.com`,
`maps.google.com` and `policies.google.com` do not resolve here):

- **Google Maps Platform Terms of Service**, last modified **26 August 2026**, <https://cloud.google.com/maps-platform/terms>:

  > **3.2.2 Requirements for Using the Services. (a) Terms of Service and Privacy Policy.** (i) The Customer Application's terms of service will (A) notify
  > users that the Customer Application includes Google Maps features and content; and (B) state that use of Google Maps features and content is subject to the
  > then-current versions of the: (1) Google Maps End User Additional Terms of Service at https://maps.google.com/help/terms_maps/; and (2) Google Privacy
  > Policy at https://policies.google.com/privacy.

  (iii) of the same section: if users fail to comply with the Google Maps/Google Earth Additional Terms, Pam "will take appropriate enforcement action,
  including Suspending or terminating those users' use of Google Maps features and content". Pam's Terms already let Pam limit or pause an account
  (`terms.s.limits`); no member controls anything Google provides beyond using it, so this adds nothing to build.

  **(b) Attribution.** "Customer will display all attribution that (i) Google provides through the Services (including branding, logos, and copyright and
  trademark notices); or (ii) is specified in the Maps Service Specific Terms. Customer will not modify, obscure, or delete such attribution."

  **4.4(a)** "Google collects and receives data from Customer and End Users … including search terms, IP addresses, and latitude/longitude coordinates", and
  **4.4(c)(ii)**: Pam "will not provide to Google (1) any End User's personally identifiable information". Section 3 checks Pam against this.

- **Maps Service Specific Terms**, last modified **28 October 2026**, <https://cloud.google.com/maps-platform/terms/maps-service-terms>: **A.2**
  "Customer will attribute all the Services in accordance with the Documentation"; **14.1** Places API content may be used without a Google map;
  **14.2** it may not be used with a non-Google map; **14.3** latitude and longitude may be cached for up to 30 days.

## 2. What is missing

Searched on the b78 tree (`mira/b78` @ `0c820c27`): all seven language files for `Google`, `terms_maps`, `Additional Terms`, `policies.google.com`; every
`terms.*` key in every language; `docs/` (legal, before-launch, google-places); `apps/site` (the website); the code. Result: **no Terms key mentions Google in any
language, and the two addresses appear nowhere.** The only Google lines in the legal copy are Privacy `sharing.p5` (the Trips map: Google gets the phone's IP
address and the part of the map viewed), `sharing.p6` (the calendar link) and `sharing.p7` (street search).

Where Pam uses Google Maps Platform (so where the notice applies): the **Trips map** (Maps JavaScript API, `TripsMap.tsx`, `maps.googleapis.com`) and **street
search** (Places API (New), called by Pam's server, `places-search`, `places.googleapis.com`). The links that open Google Maps or Apple Maps in another app are
links, not Maps Platform use. Iris's later "hours from Google" idea would be a third use; the same paragraph covers it ("Google Maps features and content").

## 3. Privacy and the member

Nothing in this change sends Google anything new. Checked against the code:

- Street search (`supabase/functions/places-search/handler.ts`): Pam's server sends the words typed, a one-search code, and `includedRegionCodes: ['us']`; for a
  pick, a Place Details call for that place id with `X-Goog-FieldMask: location,formattedAddress`. No name, phone number, account id or the phone's IP address
  (the phone never talks to Google for this). That is what `sharing.p7` says, and it is consistent with ToS 4.4(c)(ii): the typed address is the search term
  Google's own terms say it receives; Pam adds nothing about the person.
- Trips map: the phone loads the Maps script, so Google gets the IP address and the part of the map viewed: `sharing.p5`, unchanged.

So the Privacy page needs no new line for this. The new Terms paragraph ends by pointing at it ("Our Privacy page says what Google gets…"), which is true of
both lines.

## 4. The English for Will to sign

A new Terms section after "Limits" and before "Changes": id `google-maps`, three paragraphs (`terms.s.google-maps.title`, `.p1`, `.p2`, `.p3`).

> **Google Maps**
>
> **p1** Pam uses Google Maps features and content. Two examples are the map in Trips and the address suggestions when you type a street address to look for places near it.
>
> **p2** Using them is subject to Google's own terms, in the versions in force when you use them: the Google Maps/Google Earth Additional Terms of Service (https://maps.google.com/help/terms_maps/) and the Google Privacy Policy (https://policies.google.com/privacy).
>
> **p3** Our Privacy page says what Google gets when you use them.

Why it reads this way: p1 is Google's "(A) notify users that the app includes Google Maps features and content"; p2 is "(B) … subject to the then-current
versions of …" with both addresses exactly as Google names them ("in the versions in force when you use them" is "then-current versions"); p3 is Pam's own
and optional (Will may drop it; the guard needs only p2). "Google Maps/Google Earth Additional Terms of Service" is the name Google gives the document at that
address in §3.2.2(a)(iii); (a)(i) calls it "Google Maps End User Additional Terms of Service"; both are Google's.

The two addresses print as plain text (the Terms page draws paragraphs as plain text, so they are not tappable). That meets "at <address>". Making the two
addresses tappable is a small change to `LegalPage` (a link under the paragraph), for Dot or Ava, and not needed to ship.

## 5. What I could and could not read: attribution

- **Read:** ToS §3.2.2(b) and Service Specific Terms A.2 (above). They require showing the attribution Google provides, unmodified, "in accordance with the
  Documentation".
- **Could not read:** the Documentation itself (Policies and attributions for Places API, on `developers.google.com`): the host does not resolve from this session
  (`getaddrinfo ENOTFOUND`; Iris hit the same). **To check from somewhere that can reach it, or ask Will to:** that page's current wording on (1) the logo for
  Places content shown without a Google map, and (2) third-party attributions.
- **What Pam does today** (from `PoweredByGoogle.tsx`, written to the page "as Mira read it on 13 October", D-552, D-557): street suggestions always carry
  Google's own "Google Maps" logo files, unaltered, 18px (inside Google's 16 to 19), the clear space around them, alt text "Google Maps", the words "Google Maps" if
  the file fails; and it is shown whenever suggestions are (`AreaPicker.tsx`). The Trips map is Google's own, so its logo and copyright come with it
  (`disableDefaultUI: true` turns off the controls, not the logo; a search of the web app's code and styles finds nothing that hides Google's marks; I did
  not see it in a browser). Where Google does not draw it, Pam draws a plain preview from its own pins; 14.2 is about Places API content on a non-Google map,
  and those pins are Pam's own places (I did not trace where each place's coordinates came from; Iris's note covers what Pam may keep).
- **Two small things to look at when the page can be read:** (a) after a pick, the search-area chip shows the ZIP taken from Google's address, with no mark
  next to it (the pick is used for that search only and is never kept, Will 13 October); (b) the pick asks Google only for `location,formattedAddress`, which carry no
  third-party attributions as far as I know, but that is what the page would say. Neither blocks the Terms paragraph.

## 6. To ship it (after Will signs)

1. `terms.s.google-maps.title/p1/p2/p3` in en and the six languages (I translate after he signs; the two addresses stay as written, and Google's document names stay in
   English with a short translation beside them); `copy:ack`.
2. `legal.ts`: `section('terms', 'google-maps', 3)` between `limits` and `changes`; `legal:date terms <the day it ships>`.
3. The guard in `test/third-party-hosts.test.ts` then applies on its own (the Terms key exists, so every language must hold both addresses); remove nothing.
4. The line goes live in the same batch as the next Terms or Privacy date; it does not need the street-search key (`GOOGLE_MAPS_SERVER_KEY`) to be set, because the Trips
   map already uses Google where a browser key is set.
