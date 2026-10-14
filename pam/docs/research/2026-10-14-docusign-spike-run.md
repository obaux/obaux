# DocuSign spike — how to deploy and run it (Piper, 14 October 2026)

Branch `claude/places-programs-docusign-spike`. **Never merged.** Plan: `2026-10-14-docusign-spike-plan.md`.

**Deploy (merge desk):** `docusign-spike` with `verify_jwt` **on**; `docusign-spike-hook` with `verify_jwt` **off**. Set `DOCUSIGN_SPIKE_KEY_SHA256` (sent by Piper) and `DOCUSIGN_SPIKE_UNTIL` (now + 48 h, ISO). Will has set `DOCUSIGN_PRIVATE_KEY`, `DOCUSIGN_INTEGRATION_KEY`, `DOCUSIGN_USER_ID`, `DOCUSIGN_ACCOUNT_ID`. `/connect` answers 503 until `DOCUSIGN_CONNECT_KEY` exists (Will, from Connect Keys). Set `DOCUSIGN_SPIKE_LOG_PAYLOAD=1` only for the E1 Connect check, then remove it.

**Run (Piper):** `whoami` first (also tells us if consent is still needed). The key is in a file in the container, never in a message.
`SUPABASE_URL=… SUPABASE_ANON_KEY=… SPIKE_KEY_FILE=… node scripts/docusign-spike/mint-server.mjs` gives Iris's script `MINT_E1=http://127.0.0.1:8787/mint/E1`, `…/mint/Ear`, `…/mint/E100`.

**Cleanup:** delete both functions and the spike secrets; in DocuSign, the test envelopes and templates and the Connect config; then this branch.
