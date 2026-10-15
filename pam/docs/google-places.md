# Google Places API (New): setup, daily caps and cost

Street search talks to Google's Places API (New) from Pam's server only. A key limited to that API and a daily cap
on every request type keep it inside Google's free monthly amounts. Over a cap, Google refuses the call and bills
nothing, and Pam falls back to its own areas.

Source: Will's doc "PAM — Google Places API (New) setup & cost guardrails" (13 October 2026), stored here at his
request on 14 October. The merge desk checked it against the code the same day ("What Pam calls today"). The key's
value and the Google Cloud project's id are left out on purpose; both are in Google Cloud Console.

## What is set up (Will, 13 and 14 October 2026)

| Item | Setting |
| --- | --- |
| API enabled | Places API (New), `places.googleapis.com` |
| Key, API restriction | Places API (New) only |
| Key, application restriction | None yet (see "Open items") |
| Where the key lives | Google Cloud Console, APIs & Services → Credentials; Supabase edge function secret `GOOGLE_MAPS_SERVER_KEY` (Will, 14 October 05:51). Never in the repository. |
| Older key on the same project | "Maps Platform API Key" (created 2 October 2026, 32 APIs, HTTP-referrer restricted); not changed |

The key's name appeared as "PAM Street search API (New) key" while it was being made. Check the name in Credentials.

## Daily caps

Each cap is about the lowest free monthly amount for that request type, divided by 30. One cap covers every pricing
tier of its request type, so it is sized for the most expensive tier Pam could hit.

| Request type (quota) | Before (per day) | Now (per day) | Free per month, lowest tier | Why |
| --- | --- | --- | --- | --- |
| AutocompletePlacesRequest | 175,000 | 300 | 10,000 | 10,000 ÷ 30 ≈ 330 |
| GetPlaceRequest (Place Details) | 125,000 | 30 | 1,000 (Enterprise) | Contact fields bill as Enterprise |
| SearchNearbyRequest | 75,000 | 30 | 1,000 (Enterprise) | Same |
| SearchTextRequest | 75,000 | 30 | 1,000 (Enterprise) | Same |
| GetPhotoMediaRequest (Place Photos) | 175,000 | 30 | 1,000 | Photos have a 1,000 free tier |
| LookupMediaRequest | 75,000 | 0 | — | Not used by Pam |
| LookupReviewPostsRequest | 75,000 | 0 | — | Not used by Pam |
| LookupUserContentSummaryRequest | 75,000 | 0 | — | Not used by Pam |
| SearchMediaRequest | Unlimited | 0 | — | Not used by Pam |
| SearchReviewPostsRequest | Unlimited | 0 | — | Not used by Pam |

- Per-minute quotas stay at Google's defaults: 600 a minute, 12,000 for Autocomplete. The daily caps are the limit
  that binds.
- Caps reset at midnight Pacific.
- A call over a cap gets HTTP 429 `RESOURCE_EXHAUSTED` and is not billed.
- To change a cap: Google Maps Platform → Quotas → Places API (New) → the row's menu → Edit quota.

## What Pam calls today (checked in the code, 14 October 2026)

Only `supabase/functions/places-search` calls Google, from Pam's server. Phones never do. It makes two kinds of call:

| Action | Google request type | Field mask | Billed tier | When |
| --- | --- | --- | --- | --- |
| `suggest` | AutocompletePlacesRequest (`places:autocomplete`, with a session token, limited to the Philadelphia box and the US) | None (Autocomplete takes none) | Autocomplete | After a 400 ms pause in typing (`PAUSE_MS`), and only when the words look like an address and no Pam program matches them |
| `choose` | GetPlaceRequest (Place Details) | `location,formattedAddress` | Essentials (10,000 free a month) | In the area drawer (live), once per address a member picks. In the one-search build (a86, not shipped), automatically for the first suggestion after each typing pause. |

- **When Google refuses a call** (over a cap, or any error), the function answers `unavailable: true`. The search
  then shows Pam's own areas and programs, so a cap never breaks the app. The typed address just isn't placed.
- **Per-person limit:** the function also allows each signed-in person 40 calls a minute.
- **Calls Pam never makes:** Text Search, Nearby Search and Photos.
- **Contact details come from Pam, not Google.** A program's phone number, website and hours come from Pam's own
  database. This answers Will's question on his doc: yes, Pam's provider data holds them, so no Google call needs a
  Contact (Enterprise) field.
- **The Trips map is separate.** It loads Google's browser Maps JavaScript API with `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
  (`apps/web/src/screens/TripsMap.tsx`). That key is a browser key, probably the older referrer-restricted one.
  Check before retiring that key.

## What this means

- **The Place Details cap of 30 a day is the one that binds.** It was sized for Enterprise fields, but Pam asks only
  for Essentials fields. Raising it to 300 a day stays inside the free amount (10,000 ÷ 30 ≈ 330). That change is
  Will's, in Cloud Console.
- **The one-search build (a86) uses more Place Details calls.** It looks up the first suggestion after every typing
  pause, so a typed address can use more than one call. At 30 a day, that is only a handful of address searches a day
  for all of Pam. Before a86 ships, its Place Details calls should come down to about one per search, and the cap
  should go up.

## Rules for anyone adding a Google call

1. Google bills a Place Details, Text Search or Nearby Search call at the tier of the most expensive field in its
   field mask. One extra field can move a call from 10,000 free a month to 1,000.
2. Always send a field mask, with only the fields the screen shows. A call without a mask is an error.
3. Never ask Google for contact fields (phone, website, opening hours, ratings, reviews, summaries). Take them from
   Pam's own database. They bill as Enterprise, or Enterprise + Atmosphere.
4. Place ids are free to store and reuse. Cache them.
5. Every new host a server function calls needs a Privacy line first (the host guard test enforces this). Every new
   request type needs its daily cap checked.
6. To place pins, use Text or Nearby Search with `id` and `location` only. Fetch details only when a member taps a pin.

| Field | Place Details tier | Text / Nearby Search tier |
| --- | --- | --- |
| `id`, `name`, `photos` (references only) | Essentials (IDs Only), unlimited free | Text: Essentials (IDs Only), except `photos` = Pro · Nearby: Pro |
| `formattedAddress`, `location`, `types` | Essentials | Pro |
| `displayName`, `businessStatus`, `googleMapsUri` | Pro | Pro |
| `nationalPhoneNumber`, `internationalPhoneNumber` | Enterprise | Enterprise |
| `websiteUri`, `regularOpeningHours`, `currentOpeningHours` | Enterprise | Enterprise |
| `rating`, `userRatingCount` | Enterprise | Enterprise |
| `reviews`, `editorialSummary`, `generativeSummary` | Enterprise + Atmosphere | Enterprise + Atmosphere |

## Cost if Pam ever used Enterprise fields

Enterprise is a pricing tier, not a plan to buy. It is billed pay-as-you-go per 1,000 calls after the 1,000 free calls
a month. Google's subscriptions (Starter $100 for 50,000 calls, Essentials $275 for 100,000, Pro $1,200 for 250,000)
cover only Essentials and Pro, never Enterprise.

| Calls a month (list price, after the free 1,000) | Place Details Enterprise | Text or Nearby Search Enterprise | Place Details Pro, for comparison |
| --- | --- | --- | --- |
| 10,000 | $180 | $315 | $85 |
| 50,000 | $980 | $1,715 | $765 |
| 250,000 | $4,380 | $7,665 | — |

Enterprise list prices per 1,000 calls, up to 100,000 a month: Place Details $20, Text or Nearby Search $35, with
Atmosphere $25–$40. Google's [public programs](https://developers.google.com/maps/billing-and-pricing/public-programs)
give extra credits to nonprofits and startups, which may fit Pam.

## Open items

| Item | Who | Note |
| --- | --- | --- |
| Raise the Place Details (GetPlaceRequest) cap from 30 to 300 a day | Will | Pam's mask is Essentials only. Before a86 ships. |
| Make a86 look up about one Place Details call per search, not one per typing pause | Piper | No visible change |
| Add a billing budget alert on the project's billing account | Will | A second safety net |
| Application restriction on the server key | Will, with the merge desk | Supabase edge functions have no fixed outbound IP Pam controls, so an IP restriction may cut street search off. The API restriction and the caps are the guard until that is checked. |
| Confirm the key's display name in Credentials | Will | |
| Decide whether the older "Maps Platform API Key" is still needed | Will, with Piper | The Trips map may use it (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`) |

## Sources

- [Google Maps Platform price list (global)](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Google Maps Platform pricing overview: subscriptions and free caps](https://developers.google.com/maps/billing-and-pricing/overview)
- [Place Data Fields (New): which field bills at which tier](https://developers.google.com/maps/documentation/places/web-service/data-fields)
- Google Cloud Console for Pam's project: the Places API (New) pricing tab and Quotas page (Will, 13 October 2026)
- The code: `supabase/functions/places-search/handler.ts`, `apps/web/src/lib/useStreetSearch.ts`,
  `apps/web/src/lib/streetSearch.ts` (`PAUSE_MS`), and, on the a86 branch, `apps/web/src/lib/useAddressOrigin.ts`
