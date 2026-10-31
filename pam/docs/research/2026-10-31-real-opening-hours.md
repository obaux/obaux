# Real opening hours: what Google allows, what it costs, and how to get them right (31 October 2026)

Iris, for Will. The merge desk asked at 20:40 for research on how Pam gets real opening hours,
with Google as the first idea. Will's note (n-20261031-2035): "We need to set up a research project
to get hours from google. And do this correctly. It's not acceptable to have fake hours on the real
app." This is research only. Nothing is built, and Google was not called.

## In plain words, for Will

**Pam can't copy Google's hours into its own database.** Google's terms let Pam keep a place's Google
id for as long as it likes, and a map location for 30 days. They don't let Pam keep opening hours,
whether a script copies them or a person does by hand.

What I'd do:

1. **Keep Pam's own hours, from the place itself.**
   - Libraries: from the Free Library's own schedule.
   - Behavioral health programs: from the program, confirmed by its lead or by a phone call.
   - Every hours line says where it came from and when it was checked. This is how the 6 OIC
     programs already work: their hours came from OIC's own website.
2. **Use Google only for what the terms allow.**
   - **Now:** find each place's Google id. It's free to keep, and it makes "See on Google Maps" open
     the exact listing.
   - **Later, if the trial goes well:** a live "Hours from Google" line, fetched each time a member
     opens a place and never saved, shown with Google's logo. Only where the match rules say the
     Google listing really is that program.
3. **Never show a guess.** A place with no checked hours says "Call before you go", with its phone
   number and the Google Maps link. That's true, and it's better than a wrong time that sends
   someone to a locked door.

This changes the job Piper was given: `enrich-places` should store the Google id and the match
decision, never Google's hours.

## 1. Google's terms

Read on 31 October 2026 from the two pages in force:

- the [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms), last
  modified **26 August 2026**;
- the [Maps Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms),
  last modified **28 October 2026**.

The quotes below are word for word.

**The general rule (Terms of Service §3.2.3):**

> (a) No Scraping. Customer will not export, extract, or otherwise scrape Google Maps Content for use
> outside the Services. For example, Customer will not: (i) pre-fetch, index, store, reshare, or
> rehost Google Maps Content outside the services; (ii) bulk download … places information …; (iii)
> copy and save business names, addresses, or user reviews …
>
> (b) No Caching. Customer will not cache Google Maps Content except as expressly permitted under the
> Maps Service Specific Terms.

**What the service terms do permit:**

> A.3 Google ID Caching. Customer may cache the Google ID values from the Services that return such
> field and allow caching, in accordance with its Documentation. For example, Customer may cache (a)
> place_id from Places API …

> 14.1 Use without a Google Map. Customer may use Google Maps Content from the Places API in Customer
> Applications without a corresponding Google Map.
>
> 14.2 No use with a non-Google map. Customer must not use Google Maps Content from the Places API in
> conjunction with a non-Google map.
>
> 14.3 Caching. Customer may temporarily cache latitude and longitude values from the Places API for
> up to 30 consecutive calendar days, after which Customer must delete the cached latitude and
> longitude values.

**What that means for Pam:**

| Question | Answer |
|---|---|
| May Pam store Google's opening hours in its database? | **No.** Hours aren't among the things §14.3 and A.3 let Pam keep, so §3.2.3(a) and (b) forbid storing them. That covers a background job, and a person reading Google Maps and typing the hours in. |
| For how long? | Not at all. Not even a short cache: the only time-limited cache allowed for Places is latitude and longitude, for 30 days. |
| What may be kept indefinitely? | The `place_id` (A.3). Pam's `services.place_id` column already exists for this (`0003_services.sql`). |
| What else may Pam keep? | Its own decisions about a place: "this Google listing is this program", a match score, the date it was checked, and who checked it. These are Pam's data, not Google's content. Google's own name, phone or hours for the place may not be kept. |
| What is allowed instead? | Showing Google's hours live: fetched through Pam's server when a member opens a place, shown, and not kept (§14.1). |
| Attribution when the hours appear without a Google map | Google's policy page for Places says data shown without a Google map must carry the **Google logo** (or the words "Google Maps" where space is short), unchanged, plus any third-party attributions Google returns ([Policies and attributions for Places API](https://developers.google.com/maps/documentation/places/web-service/policies)). Pam's street search already shows Google's mark (`docs/street-search/v3-2-results-with-the-google-mark.png`). |
| Anything else that applies | §3.2.2(a): Pam's own terms must say the app uses Google Maps content and point to Google's end-user terms and privacy policy. Lena should check whether the street search work already added this. |

How sure I am: high on the terms text, which I read directly. Medium on the attribution details:
`developers.google.com` isn't reachable from this session, so they come from Google's policy page as
quoted in search results. Lena should check the policy page before anything ships. I'm not a lawyer,
and the quotes are here so someone who is can check them quickly.

## 2. Cost

The tiers and prices below are from `docs/google-places.md`. Will took them from Google's price list
and field tables on 13 October 2026 ([pricing](https://developers.google.com/maps/billing-and-pricing/pricing),
[data fields](https://developers.google.com/maps/documentation/places/web-service/data-fields)). I
couldn't re-open those pages from here, so they should be re-checked in Cloud Console before the
trial.

- **`regularOpeningHours` and `currentOpeningHours`** bill at **Enterprise**, on both Place Details
  and Text Search.
- **`nationalPhoneNumber`** is also Enterprise. That matters, because the phone is the best match
  signal.
- **`displayName`, `businessStatus` and `types`** are Pro.
- **Enterprise:** 1,000 free calls a month. After that, $20 per 1,000 for Place Details and $35 per
  1,000 for Text Search. Google's subscriptions don't cover Enterprise.

| What | Calls | Cost |
|---|---|---|
| **Matching, once:** one Text Search, then one Place Details for each of the ~588 places | ~588 + ~588 | $0 if run in a month with nothing else at Enterprise. Both are under 1,000 free. |
| **Re-matching** (new or changed places) | a few dozen a month | $0 |
| **Storing hours from Google** | — | Not allowed (§1) |
| **The live "Hours from Google" line**, one Place Details (Enterprise) each time a member opens a place that has a trusted match | 1 per view | 3,000 views a month: 2,000 billable, **$40**. 10,000 views: **$180**. 30,000 views: **$580**. |
| **The free link**, "See on Google Maps" with the stored `place_id` | 0 API calls | $0. It's a URL; `googlePlaceHref` and `public.google_place_url` already build it (`0018_google_place_url.sql`). |

**Caps.** The GetPlaceRequest cap is 30 a day today, and street search shares it. So:

- The one-off matching run needs the cap raised for a few days, or it takes about 20 days at 30 a
  day.
- A live hours line needs its own budget. Either a daily cap sized to the views Will is willing to
  pay for, with the free link shown when it's reached, or the free link only.
- The open item in `google-places.md`, a billing budget alert, should be done first.
- Google's nonprofit credits ([public programs](https://developers.google.com/maps/billing-and-pricing/public-programs))
  may cover the live line. Worth asking.

## 3. Matching the right listing

The risk Will named is real. Many of the 524 behavioral health locations are inside hospitals,
campuses and shared buildings. About 67 providers share many addresses. There, Google's listing is
usually the building or the hospital, and its hours aren't the program's. A methadone clinic's dosing
hours aren't the building's office hours. All 6 OIC programs sit at one address.

**Rules for accepting a match automatically.** All of these must be true:

1. **Distance:** Google's location is within 75 m of Pam's point, or the street numbers match.
2. **Phone:** Google's phone agrees with Pam's phone, comparing the last 10 digits. Pam's phones are
   now filled in, and this is the strongest single signal. The phone is compared in memory and never
   kept.
3. **Name:** after taking out the common words (inc, llc, the, of, center, program, services), at
   least 60% of the words in Pam's name appear in Google's `displayName`, or the other way round.
4. **Type:** Google's `types` fit the category. A library has `library`; a behavioral health
   program has a health type such as `doctor`, `health`, `medical_clinic`, `mental_health_service`,
   `drug_rehabilitation` or similar.

**Leave it empty** (no trusted match, so no Google hours; send it to a human queue and keep only Pam's
own hours) when any of these is true:

- Google's types include `hospital`, `university`, `school`, `shopping_mall`, `premise` or
  `subpremise`, or the place is only a generic `point_of_interest`. That's a building, not a
  program.
- Two or more Pam listings get the same Google `place_id`. That's one listing for many programs, as
  with the OIC building.
- The phones disagree, or Google has no phone, and nothing else is strong.
- The program is an opioid treatment or dosing program. Its hours must come from the program.
- `businessStatus` isn't `OPERATIONAL`. That goes to a human to check with the place itself, never
  shown from Google alone.

Expected result: libraries will match well, since each branch is its own building with its own
listing. A large share of the behavioral health locations will land in "leave empty". That's the
point: for them the right source is the provider.

## 4. Fresh hours and closures

- **`currentOpeningHours`** includes Google's special hours (holidays and closures) for the coming
  days. **`regularOpeningHours`** is the usual week. Shown live, both are as fresh as Google's.
  Stored, they'd go stale, and storing isn't allowed anyway.
- **`businessStatus`** (`OPERATIONAL`, `CLOSED_TEMPORARILY`, `CLOSED_PERMANENTLY`) is a useful
  warning. It can be read live, or by the matching job, to put a place in front of a human. The human
  then records a closure from the place's own source. Pam keeps the closure as its own fact, with its
  source, not Google's word.
- **Pam's own hours:** re-check every 90 days (`last_verified_at`), plus at the Free Library's
  seasonal changes, plus whenever a lead edits them (`provider_edited_fields`, which the importer
  never overwrites).
- **The closed library branches:** Falls of Schuylkill (closed until 11 January 2027) and McPherson
  Square (until spring 2028). I couldn't check what Google says: calling Google isn't mine to do, and
  `freelibrary.org` isn't reachable from this session. They're in the trial (T-closed below), and
  until then they should show the Free Library's own closure note, not hours.

## 5. Other sources, and what members see

| Source | For | Notes |
|---|---|---|
| **The Free Library's own published hours** | the 52 libraries | Since 2023 the branches keep standard schedules, with longer hours at Parkway Central ([Billy Penn, 17 October 2023](https://billypenn.com/2023/10/17/free-library-philadelphia-n)). Each branch's page on [freelibrary.org/locations](https://libwww.freelibrary.org/locations/) shows the day's hours. The City's library map layer is from 2012 and has no hours ([PASDA, Philadelphia Libraries](https://maps.pasda.psu.edu/arcgis/rest/services/pasda/CityPhilly/MapServer/12)). Best route: ask the Free Library for its branch schedule (a sheet or a feed), and record each branch's hours with "from the Free Library" and the date. |
| **The program itself** | behavioral health and the hand-added places | A program lead confirms or edits on Pam: recorded in `provider_edited_fields`, so no import overwrites it. For a program with no lead on Pam, the team phones it and records "confirmed by phone" and the date. |
| **The organisation's own website** | where a site publishes hours | As with OIC (`0025_oic_philadelphia.sql`, from oicphila.org's own schema.org block). |
| **Google, live** | after the trial, trusted matches only | Never stored. |

**What a member sees on a place.** The hours look the same whatever the source. One short line under
them says where they're from:

- "Hours from the Free Library · checked 31 Oct"
- "Hours from the program · confirmed 2 Nov"
- "Hours from Google" with Google's logo. Never a date for these, since they're live.
- No hours: "Call before you go", with the call button and "See on Google Maps".

D-044 still stands: no "Open now" chip. Sage writes the words.

## 6. Trial plan, for the desk to run after Will says yes

**Places (30):**

- **10 libraries:**
  - Parkway Central, plus 7 neighbourhood branches spread across the city;
  - Falls of Schuylkill and McPherson Square (**T-closed**).
- **10 behavioral health:**
  - 3 inside a hospital or campus;
  - 3 opioid treatment programs;
  - 4 stand-alone outpatient programs.
- **6 OIC:** all at one building.
- **4 hand-added places.**

**The truth to compare against, entered by hand before the run, from the places' own sources:**

- the OIC hours already in Pam (Monday to Friday, 8:00–16:00);
- the 10 libraries' hours from the Free Library's site;
- for the behavioral health places, the hours a phone call or the provider's own site gives, where
  the desk can get them.

**The function: `hours-trial`**, a Supabase Edge Function. It's not `enrich-places`, and it's removed
after the trial.

- **Who may call it:** the service role only, or a super admin's sign-in. It uses
  `GOOGLE_MAPS_SERVER_KEY`, which is already in the function secrets. It calls the host street search
  already uses, `places.googleapis.com`, so there's no new host and no new Privacy line.
- **Input:** a list of Pam service ids.
- **For each place:**
  1. **Text Search (New):** "name, address", biased to a 150 m circle around Pam's point. Field mask
     `places.id,places.displayName,places.location,places.types,places.nationalPhoneNumber,places.businessStatus`.
  2. **Place Details (New)** for the top candidate. Field mask
     `id,regularOpeningHours,currentOpeningHours,utcOffsetMinutes`.
  3. **Apply the match rules (§3)** in memory.
  4. **Compare Google's week with the truth day by day**, in memory.
- **What it writes, and only this:** a `hours_trial` table with:
  - service id;
  - `place_id` (allowed);
  - accepted, empty, or which rule failed;
  - distance in metres;
  - phone agrees yes or no;
  - number of days whose hours agree with the truth (0–7);
  - whether `businessStatus` is operational, yes or no;
  - when it ran.

  None of Google's names, phones or hours.
- **Calls:** about 30 Text Search and 30 Place Details. That's inside the 1,000 free a month. It
  needs the GetPlaceRequest and SearchTextRequest caps at 60 for the day, or runs over two days.

**What to measure:**

| Measure | Pass |
|---|---|
| Match rate: accepted ÷ 30 | Reported. No target, since the empty answers are expected. |
| Wrong matches: accepted, but the desk finds it's another listing (checked through the Google Maps link) | **0** |
| OIC: all 6 left empty by the shared-listing rule | 6 of 6 |
| Libraries: hours agree on 7 of 7 days with the Free Library's own | at least 9 of 10 open branches |
| T-closed: the closed branches are flagged by `businessStatus`, or their hours disagree | Report what Google says, for Will |
| Behavioral health: share left empty, and why | Reported. It decides whether the live line is worth it for them. |

**After the trial,** Will decides two things:

1. matching for all ~588 places (free, a few days with the caps raised);
2. whether to add the live "Hours from Google" line, at about $20 per 1,000 views after the first
   1,000, or keep only the free link.

Either way, Pam's own hours come from the places themselves.

## Sources

- [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms), last modified
  26 August 2026, §3.2.2 and §3.2.3. Read 31 October 2026.
- [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms),
  last modified 28 October 2026: A.3 (Google ID Caching), §14 (Places API). Read 31 October 2026.
- [Policies and attributions for Places API](https://developers.google.com/maps/documentation/places/web-service/policies):
  the logo when there's no map. Not reachable from this session; seen through search results.
- `pam/docs/google-places.md` (13–14 October 2026): field tiers, prices, caps and Pam's calls today,
  from Google's [pricing](https://developers.google.com/maps/billing-and-pricing/pricing) and
  [data fields](https://developers.google.com/maps/documentation/places/web-service/data-fields)
  pages.
- [Free Library locations](https://libwww.freelibrary.org/locations/) and
  [Billy Penn, 17 October 2023](https://billypenn.com/2023/10/17/free-library-philadelphia-n): the
  branches' standard schedules.
- [PASDA, Philadelphia Libraries (2013 layer)](https://maps.pasda.psu.edu/arcgis/rest/services/pasda/CityPhilly/MapServer/12).
- Pam's code: `0003_services.sql` (`place_id`, `hours`, `provider_edited_fields`,
  `last_verified_at`); `0018_google_place_url.sql`; `0025_oic_philadelphia.sql` (the hours shape, and
  hours from the organisation's own site); `supabase/functions/places-search`.

Iris
