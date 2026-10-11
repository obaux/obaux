# 2026-10-11 — link preview agent

**Branch:** `claude/messages-link-preview-agent` · **Lane:** Messages & notifications

## What changed

`supabase/functions/link-preview/index.ts` line 40: the `User-Agent` a link preview sends names `https://joinpam.org`, not the old vercel.app deployment address. One line.

## What was wrong, and what missed it

Every site a member links to saw `https://web-ten-umber-88.vercel.app` in the agent string. Found by Lena's third-party host guard review.

## Decisions made

None.

## Verified

`linkPreview.test.ts` (config): passes. The function is not deployed by this change; the merge desk redeploys `link-preview` after it merges.

## Left undone

Nothing.

## Needs a human

Nothing.
