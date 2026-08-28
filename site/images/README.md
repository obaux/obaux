# Images

- `will.jpg` — Will's photo, shown on the "Text Will" button and in the drawer bio (falls back to a plain "W" avatar if missing).
- `items/` — item photos. Add files here, then in Admin mode use each item's **Photos** button to paste the relative path(s), e.g. `images/items/round-bookshelf-1.jpg, images/items/round-bookshelf-2.jpg` (1-3 recommended). Any hosted image URL works too, not just files in this folder.

## Size
Every image is compressed to JPEG, capped at 1400px on the long edge, targeting under 500KB (as low a quality as needed to hit that, down to a floor of ~35). Uploads that arrive as PNG/WebP/AVIF or oversized get converted/resized to match — re-run the same conversion on any new batch rather than committing raw originals.

## Ordering rule
When a set of photos for one item is named `Name 1`, `Name`, `Name 2`, `Name 3` (a bare, unnumbered file among numbered ones), display them in the order they were written: **1, bare, 2, 3** — the unnumbered file is not automatically the cover photo, it slots in exactly where it falls in that sequence.

## Uploading a new batch of photos (workflow)
When photos are pushed straight to GitHub (web upload, wherever they land — `site/`, repo root, `site/images/`, etc.), process them as:
1. Group files by their label (the filename with the trailing number stripped) — each distinct label is one item, one photo set.
2. If a label matches an existing item's title, add those photos to that item instead of creating a new one (ask if it's ambiguous, e.g. could be a second unit of the same thing).
3. For each new label: pick a category from the existing set (add a new one only if nothing fits), a reasonable starting bid (no need to guess retail value — leave it unset unless given), and convert/resize/rename the files into `images/items/<slug>-1.jpg`, `-2`, etc. (see Size above), following the ordering rule above.
4. Create a real Stripe product + price (`custom_unit_amount` enabled, minimum = starting bid) + Payment Link for each new item, same account/flow as the rest of the catalog.
5. Insert the item into Supabase (`slug`, `title` = the image label verbatim, `starting_bid_cents`, `current_bid_cents` = same, `category`, `images`, `stripe_payment_link`).
6. Commit the renamed files, push to the working branch, and offer to merge — don't merge without being asked.
