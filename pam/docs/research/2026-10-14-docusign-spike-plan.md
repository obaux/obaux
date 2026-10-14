# DocuSign sandbox spike — plan (Piper, 14 October 2026, for Mira; card a88)

Step 1 of `2026-10-14-forms-and-docusign-plan.md`. **Nothing runs until Mira says consent is done.** No migration, no merge, no app code. Sandbox only, made-up people only; nothing is sent to a real person. Iris's test plan: `docs/research/2026-10-14-docusign-sandbox-test-plan.md` on `claude/research-help-site`.

## 1. What gets deployed to the live project, and its name

Two functions, spike code on **its own branch, never merged**. If it were merged, `third-party-hosts.test.ts` would fail on the new host, which is the safe default.

| Function | Who may call it | Does |
|---|---|---|
| **`docusign-spike`** | the test only (section 2); `verify_jwt` on (the anon key passes it) | `consent` (returns the consent link), `whoami` (token, account id, base URI, checks they match the secrets), `envelope` (E1, E100 or E-ar), `mint` (a new one-time signing link for an envelope), `status`, `purge`, `template-view` (embedded tagging link) |
| **`docusign-spike-hook`** | public (DocuSign and a browser), `verify_jwt` off | `POST /connect` (the Connect webhook, HMAC checked) and `GET /return` (the page a signer lands on, which only prints the event name) |

The made-up forms F1–F5 are generated once by a script on the branch, with **anchor strings** (`/fullName/`, `/initials/`, `/dob/`, `/ssn/`, `/date/`, `/sig/`) so DocuSign places the tabs itself and nobody tags by hand. The same `tabLabel` means the same thing in every form (`fullName`, `initials`, `dob`, `ssn`), each with a tooltip for screen readers. No PDF library runs on the server.

Envelopes, as Iris asked: **E1** (F1–F5 in one), **E100** (F1–F5 ×20), **E-ar** (E1, signer language Arabic). One embedded signer each (`clientUserId`), "Test Member Ana", a non-delivering address on a domain nobody owns.

**Mint:** signing links last about 5 minutes and work once, so `mint` makes a fresh one on demand. Iris gets a small local script that calls `mint` and prints or opens the URL; she sees only the URL. The DocuSign key and private key never leave Supabase secrets.

**Iris's script** (`docs/research/docusign-sandbox/signing-pages.mjs` on `claude/research-help-site`) needs three mint URLs (E1, E-ar, E100) that each create a fresh recipient view and redirect to it, with a `returnUrl` that lands on a URL containing `event=`; and an optional `&display=focused` (focused view, `frameAncestors` set to the test origin), record-only, skipped if awkward. I run it from `apps/web` once consent is done and send back `results.json`, the two aria files and the screenshots, and the hosts list it reports.

**Return:** `returnUrl` is the hook's `/return`, which shows `signing_complete`, `cancel`, `decline`, `session_timeout` and nothing else it was not told to print (an allow-list of event names).

**Connect:** set up without documents and without tab data. `/connect` verifies the HMAC and logs the envelope id, the status, and the **names of the keys present** in the payload. For the E1 test only, it also logs the whole payload (made-up data, function logs expire) so Iris can check it carries no field values. That one line is removed before anything else is tested.

## 2. How it is locked so only the test can call it (as approved by Mira, 06:08)

No live Pam account is involved in the spike, so there is no caller allow-list.
1. **JWT verification on** at the gateway for `docusign-spike` (the project's anon key passes it).
2. **A key in a header**, `x-spike-key`. I generate it in my own container and keep it there; it is in no message and no repository. Mira sets `DOCUSIGN_SPIKE_KEY_SHA256` to its SHA-256; the function hashes the header and compares the two in constant time.
3. **An end date**: `DOCUSIGN_SPIKE_UNTIL` (48 hours from deploy, set by Mira); after it every call answers 410, whatever else is right.
4. POST only, JSON only, a fixed list of actions; an unknown action answers 400. No action takes a URL or a host from the caller.
5. `docusign-spike-hook` only accepts a DocuSign-signed `/connect` (until `DOCUSIGN_CONNECT_KEY` is set it answers 503 "not set up") and prints a fixed list of event names on `/return`; it calls nothing out.
6. Nothing in the app calls either function; neither is in `apps/web`, `apps/site` or a story.

## 3. Hosts it talks to

**Only `account-d.docusign.com` (sign-in and consent; the JWT grant and user info) and `demo.docusign.net` (the eSignature API).** In code: every outbound call goes through one wrapper with that allow-list, `redirect: 'manual'`, https only; a unit test shows `fetch` to any other host throws before it is sent. The base URI DocuSign returns from user info is checked against the list too, so a changed answer cannot send a call elsewhere. The function never fetches the signing URL: it hands it back.

**Network:** the proxy in these sessions also refuses Pam's own server (`shobqzuhicoiymtumiaz.supabase.co`), so card a88 step 7 asks Will to allow that host and DocuSign's three; Mira deploys both functions after consent and deletes them and the secrets at cleanup.

**Hosts the signing page loads in a browser** (what Iris needs allowed): at least `demo.docusign.net` and `account-d.docusign.com`. DocuSign's page loads its own scripts, fonts and images from more hosts, which I do not know yet. The first run records every host the page asks for (Playwright's request log) and I send Mira the exact list; if Iris's environment cannot allow them, she hands me her Playwright scripts and I send back output and screenshots.

## 4. What Iris checks (her plan; the ones I will make possible)

Embedded signing in a frame on iOS and Android versus a redirect and return; one adopted signature and one set of initials across five forms and across 100; the same-named fields filling once across forms; the SSN tab masked; date signed filled; how it behaves at 100 documents (limits, time, whether the page stays usable); the signer's language, Arabic included (text direction, the 7 languages Pam offers); tooltips and keyboard use for a screen reader; what Connect sends (no field values) and that its HMAC checks; whether a completed envelope can be purged and what remains; and the embedded tagging view for a lead.

My own checks: JWT grant and consent with the redirect `https://joinpam.org`; that `whoami` shows the account we think; the tagging view opens from a link; purge works; and **Iris's Q1**, the production plan tier that allows API embedded signing, in DocuSign's own words, quoted with the page it came from.

## 5. What Will provides (card a88)

The four secrets in Supabase Edge Function secrets: `DOCUSIGN_PRIVATE_KEY`, `DOCUSIGN_INTEGRATION_KEY`, `DOCUSIGN_USER_ID`, `DOCUSIGN_ACCOUNT_ID`, with JWT grant and redirect URI `https://joinpam.org`; the consent click. The spike adds, set by Mira, `DOCUSIGN_SPIKE_KEY_SHA256` and `DOCUSIGN_SPIKE_UNTIL`; and the Connect key `DOCUSIGN_CONNECT_KEY`, made by Will in DocuSign (Settings › Connect › Connect Keys) when we reach the Connect step. No key, id or secret ever appears in the repository or in a log.

## 6. What gets deleted afterwards

1. Both functions, from the live project.
2. The spike secrets (and, after the test, the four DocuSign ones if Will wants the sandbox closed).
3. In DocuSign's developer account (Will, or me with consent): the test envelopes, any templates, the Connect configuration, the integration key's secret and the private key, which are rotated or deleted.
4. The spike branch stays unmerged and is deleted once the findings are written.
5. The function logs expire on their own; nothing was written to the database.
6. Kept: the findings, as a document in `docs/research/`, with what each check showed and the screenshots. No payload with real or made-up field values is kept in the repository.

## 7. Order, once Mira says consent is done

`whoami` → E1 and one mint (Iris's first signing, which also gives the host list) → Connect payload check → E-ar → E100 → embedded tagging view → purge → Q1 → findings → cleanup. About a day of work, most of it waiting on DocuSign's page.

## 8. Not decided, so not built on

Whose account (a program's own, as card a85 now recommends), the signature picture on read-and-agree policies, whether programs' PDFs are fillable, and the blue or green question. The spike answers technical questions only.
