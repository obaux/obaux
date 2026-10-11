# Open data Pam uses, and the terms it comes under

Written by Lena (Languages & legal), 11 October 2026, at the merge desk's request. **Nobody has read the City of
Philadelphia's licence text.** The City's hosts are not reachable from the sessions' sandbox, so what follows is the
standard terms-of-use notice that opendataphilly.org prints on every dataset page, as it came back from two web searches
(one by Mira, one by me, 11 October). It is a summary, not the licence: read the real text (`docs/before-launch.md`, "Read the City of Philadelphia
licence once") before anyone relies on the lines below.

## The terms, as far as they have been seen

Every layer below is listed on OpenDataPhilly with "License: City of Philadelphia License". The notice on each page says:

1. **The City keeps all its rights.** It owns its databases, and using the data gives the user no title or interest in them.
2. **No warranty.** The data is provided "as is", without warranty of any kind, and the City makes no claim that it is accurate.
3. **The user takes responsibility and holds the City harmless.** The user is liable for how they use the data and must hold the City
   harmless from any and all claims, demands and liabilities. This is a legal commitment Pam makes by using the data.
4. **Using it is agreeing to it.** Browsing City data on the portal counts as accepting the licence and the City's terms of use.
5. **Attribution: none was visible** in what was seen. Not confirmed absent. Pam shows no credit to the City anywhere today.

What this means for Pam, in plain words (not legal advice): Pam may copy the layers into its own database and show places and
addresses from them; nothing the City publishes is promised to be right, so a place card must never be the only thing between a
person and a decision that matters (the Terms already say "Call ahead when you can. If a place is wrong or closed, flag it and we will
check", `terms.s.programs.p2`); and Pam cannot hold the City responsible if a wrong address or a closed centre costs someone a trip.

**No Privacy line is needed.** None of this data is about members (Mira, 11 October). What Pam sends the City's servers is
different, and is covered: the browser no longer calls any City host (D-536), and the import runs from Pam's own database.

## The layers

| Layer | Where | What Pam takes | Where it lands | Migration |
|---|---|---|---|---|
| **City_Facilities_pub** (CityGeo, ArcGIS FeatureServer 0) | `services.arcgis.com/fLeGjb7u4uXqeF9q`, 3,197 features when checked on 12 September | An allow-list of facility types only (libraries, health centres, older adult centres); everything else is left out. Name, point and facility type. | `services` and their places | 0015 (registered), 0022 (the allow-list) |
| **PPR_Program_Sites** (Parks & Recreation) | same org, 168 points | Staffed sites that run programmes: recreation centres, older adult centres, environmental education centres, pools | `services` and their places | 0027 |
| **PPR_Properties** (Parks & Recreation) | same org, 507 polygons | Only to find an address for a program site: the nearest property within 400 m, accepted if the names agree or it is within 60 m. The properties themselves are not kept. | the address on a PPR site | 0027 |
| **DBHIDS provider locations** (`dbhids_locations_fy25_012126`, Behavioral Health) | same org | Registered and active in `service_imports` since 0015. What has been imported from it was not checked for this note; the licence on this layer was not confirmed to be the same one. | `services`, if any | 0015 |
| **OPA properties** (`opa_properties_public`, via `phl.carto.com`'s SQL API) | City of Philadelphia, Office of Property Assessment | Used once, to compute a centre for each ZIP code (the mean of the City's own property points in it, ZIPs with fewer than 200 properties left out). Only the 46 centres are kept. No owner, address or parcel is stored. | `areas` (46 ZIP rows and one landmark) | 0026 |
| **Street centerlines** | not yet imported | Piper's job, soon. Add a row here the day it lands, with the dataset's own licence line. | — | — |

On 11 October the live project held 743 `services` rows from City imports and 12 added by hand (checked with a read-only query).

Not used any more: the City's address-lookup service on `phl.carto.com`. The browser used to call it while a person typed an address
in the area picker; it no longer does (D-536, 11 October).

The other registered sources are **inactive** and bring in nothing: OpenDataPhilly's Health & Human Services catalogue and Health Centers
pages, PA 211's HSDS export, and Philadelphia DHS's "For families" page. They are not under the City licence as far as is known; if any is switched on, add it here first.

## When a layer is added or changed

Add a row above in the same change, with the dataset's own page and licence line. If a layer says anything other than "City of
Philadelphia License" (for example a Creative Commons licence that asks for credit), say so in the row and say what Pam must show, and tell Will.

## Sources of the terms, 11 October 2026

- The standard terms-of-use notice on OpenDataPhilly dataset pages, for example
  [PPR spraygrounds](https://opendataphilly.org/datasets/ppr-spraygrounds) and
  [police stations](https://opendataphilly.org/datasets/police-stations/), which two web searches returned.
- Not found, and not read: the licence's own full text, and the City's Open Data Program page on phila.gov.
