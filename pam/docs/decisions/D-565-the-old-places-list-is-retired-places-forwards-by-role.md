# D-565 — The old Places list is retired: /places/ forwards by role

**Date:** 2026-10-13 · **Branch:** `claude/places-programs-retire-old-places`

**Decided:** Will, 13 October 2026, 18:18 (relayed by the merge desk): the old `/places/` list goes; Explore is the one list.

`/places/` and `/places/?filter=reported` are now a client-side forwarder (replace, so Back does not return to it): a member goes to `/`; a case manager or program to `/programs/`; `?filter=reported` goes to `/places/reported/` for admin and super admin. A super admin has no Explore of their own, so without the filter they go to `/`. `/places/reported/` is unchanged, and so is `AreaPicker.tsx` under `app/places/` (Explore uses it).

**Why:** the old list and Explore showed the same places two ways. The Reported chip is the only thing the old list had that Explore lacks; a super admin still reaches Reported places from the Profile row and from the bell, so nothing is stranded.

**Ways back:** `from=places` is now `from=reported` on the Reported places links; `place/page.tsx` has a `reported` back entry ("Back to Reported places", new English, `nav.back.reported`, awaiting Sage and Lena); `places` still resolves, to Explore, for old links.

**Reverse if:** a role turns out to need a list view Explore does not give it.

**Follow-up (13 October, b33's place.spec):** the not-found place screen still said "Go back to Places" and headed itself "Places". It now says "Go back to Explore" (`place.notFound.body`, new English for Sage and Lena) and its title is `tab.explore`, the screen its round back goes to. `nav.back.places` and `tab.places` are no longer drawn by the app; only stories used them, and the place stories now use Explore.
