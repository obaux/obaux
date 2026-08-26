# Will's Move Out Garage Sale

Static site (`index.html`) + a Supabase backend for bids/sold-status, deployed via GitHub Pages.

## How it works
- **Sign in**: friends just type a name (stored in their browser, no password) — attached to their bids.
- **Bidding**: each item has a starting bid and a 1-week close timer from when it was listed. Any bid must beat the current highest bid. All bids write straight to Supabase (Postgres) through a security-definer function that enforces "must be higher" and "not closed/sold" — the public anon key can only call that function, not edit rows directly.
- **Admin**: the "Admin" button prompts for a passphrase (given to Will separately, not stored in this repo) to mark an item sold or paste in its Stripe Payment Link. Sold status and the payment link are then visible to everyone.
- **Realtime**: the page subscribes to Supabase realtime changes, so all viewers see new bids/sold status without refreshing.

## Backend
Supabase project: `wills-garage-sale` (id `spnilculhefkvbyomwre`). Tables: `items`, `bids`, `admin_config`. RPC functions: `place_bid`, `mark_item_sold`, `reopen_item`, `set_stripe_link`.

The anon key embedded in `index.html` is meant to be public — Row Level Security plus the RPC functions above are what actually gate writes.

## Hosting
A GitHub Actions workflow (`.github/workflows/pages.yml`) publishes this folder to GitHub Pages on push. One-time setup: in repo **Settings → Pages**, set Source to **GitHub Actions**.

## Stripe
Each item gets a Stripe Payment Link with a "customer chooses the amount" price (minimum = the item's starting bid), created once per item. The winning bidder pays their winning amount through that link after Will marks the item sold.
