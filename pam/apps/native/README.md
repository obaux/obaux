# @pam/native

Capacitor 6 shells for iOS and Android. Both wrap the same Next.js static export
as the web app, so there is one codebase and one behaviour (§1).

## First-time setup

```bash
pnpm --filter @pam/native add:ios      # generates ios/
pnpm --filter @pam/native add:android  # generates android/
```

`ios/` and `android/` are generated, not checked in.

## Every change

```bash
pnpm --filter @pam/native sync   # rebuilds the web export, then `cap sync`
```

Skipping `sync` ships the previous web build inside the app — the most common
way a fixed bug appears to come back on device.

## Native capabilities in use

| Capability | Plugin | Notes |
|---|---|---|
| Speech-to-text | `@capacitor-community/speech-recognition` | Wired to `VoiceInput` via `src/speech.ts`; permission requested on first tap, not at launch |
| Location | `@capacitor/geolocation` | Places map and the §8 geofence check-in. Denial must never block the app (§5.1) |
| Push | `@capacitor/push-notifications` | **Secondary to SMS.** Nothing may depend on a push arriving (§1, §9) |

## Store budget

§12 caps the app at 30 MB. Check before submitting — the web export is the bulk
of it, and the §12 first-load budget is what keeps it in range.
