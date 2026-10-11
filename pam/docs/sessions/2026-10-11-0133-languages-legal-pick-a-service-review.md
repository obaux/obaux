# 2026-10-11 — Languages & legal — review of Piper's `place.schedule.pickService`, in six languages

**Branch:** `claude/lena-pickservice-review` (from `main` at `0f95b4e`; a record only) · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), 01:27 UTC: check Piper's six drafts of one more key, `place.schedule.pickService` ("Pick a service above to plan a trip."; Will approved the English, card a43), together with the D-498 keys.
The drafts are on `claude/places-programs-pick-a-service-line` (bc9afa4); the key reaches `main` in the merge desk's next batch, so I read it from that branch.

## What changed

Nothing: **all six are right as Piper wrote them**, and nothing on this branch touches a locale file. Read against the app's own words:

| | Draft | Checked against |
|---|---|---|
| es | Elija un servicio arriba para planear una visita. | "Planear una visita" is the button (`trips.new.where`); "servicio" is the bundle's word; usted, like `place.dropin.body` on the same screen |
| pt-BR | Escolha um serviço acima para planejar uma visita. | "Planejar uma visita" ✓; "serviço" ✓ |
| zh-CN | 请先在上面选一项服务，再安排预约。 | "安排预约" ✓ (D-480: 预约 is the word); "服务" ✓; the "先…再…" adds the order the English implies |
| zh-HK | 請先在上面選擇一項服務，再安排到訪。 | "安排到訪" ✓; "服務" ✓; written style, 請 |
| ru | Выберите услугу выше, чтобы запланировать визит. | "Запланировать визит" ✓; "услугу" ✓ (the bundle's word, `policies.forAll`: "Все услуги") |
| ar | اختر خدمة أعلاه لتخطيط زيارة. | "خدمة" ✓; "لتخطيط زيارة" reads the label "خطط لزيارة" as a noun; fine |

No placeholders, so no agreement or case to worry about. "Above" is "arriba", "acima", "上面", "выше" and "أعلاه" (which reads right in a right-to-left page: it is above, not left or right).

## What was wrong, and what missed it

Nothing here.

## Decisions made

None.

## Verified

Read by hand against `trips.new.where` and the neighbouring `place.*` strings in all six bundles; no file changed, so no build, browser suite or fit audit. A line this short (under 60 characters in every language) is not a fit risk; the audit
runs when the key is on `main`.

## Left undone

- For Friday 16 October (Mira's note, 01:17 UTC): two welcome slides promise what the app only shows as examples (`onboarding.provider.3` "Case managers nearby can send people to you", `onboarding.admin.2` "Send someone to a program in one tap").
  Agree the meaning with Sage (`docs/voice.md`), then the English goes to Will; the six translations after.
- A native reader for the six (before-launch).

## Needs a human

Nothing.
