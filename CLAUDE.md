# Will's Move-Out Garage Sale

Static site in `site/` (single-file `index.html`), deployed to GitHub Pages by
`.github/workflows/pages.yml`. Catalog data lives in Supabase (project
`wills-garage-sale`, id `spnilculhefkvbyomwre`); payment links are real Stripe
Payment Links on account `acct_1SLqUQ0GpqK2l8yp`.

## Bidder outreach — check before drafting messages

Before drafting any check-in, follow-up, or winner message to bidders, read
`public.bidder_outreach` in Supabase. It records who has already been contacted,
on what channel, and what was covered, so a later round doesn't double-message
anyone. Insert a row for each person after Will confirms a batch went out.

```sql
select bidder_name, channel, topic, sent_at, note
from public.bidder_outreach
order by sent_at desc;
```

Bidder contact details are private. `bids.bidder_contact` is withheld from the
public `anon`/`authenticated` roles by column-level GRANT, and `bidder_outreach`
has RLS on with no policies and no grants at all — both are readable only via the
service role. Never copy phone numbers or emails into this repo; it is public.

## Off-platform / bundled sales

Some sales happen outside the normal auction flow — a buyer closes early on a
flat bundle price covering both live-site items and things that were never
listed (sold directly, off-grid). Before summarizing what a buyer owes or has
bought, check `public.direct_sales` in Supabase, not just `items`/`bids`:

```sql
select buyer_name, items, linked_item_ids, total_cents, stripe_payment_link, sold_at
from public.direct_sales
order by sold_at desc;
```

Same privacy posture as `bidder_outreach`: RLS on, no grants to `anon`/`authenticated`,
service-role only. When a bundle pulls a live item out of open bidding (marking it
`sold` early), tell Will to notify whoever was next in line that it's no longer available.

## Other conventions

- Item photos and the batch-upload workflow: see `site/images/README.md`.
- Admin RPCs use pgcrypto's `crypt()`, which lives in the `extensions` schema —
  every `security definer` admin function needs `set search_path = public, extensions`.
- Don't merge to `main` without Will asking.
