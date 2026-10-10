# 2026-10-10 — Languages & legal — review of Piper's policy upload and replace translations

**Branch:** `claude/lena-policy-strings-review` (from `main` at `c652a30`) · **Lane:** Languages & legal (Lena)

Mira's item 3: review the drafts that are on `main`. The twelve strings of the policies work (D-485) came in with it: `policies.upload.saving`, `policies.upload.problem.*`
(five), `policy.version`, `policy.file.open`, `policy.file.open.named`, `policy.replace.title`, `.hint`, `.label`. They are about documents people sign, so this is a promise
as well as a screen: `policy.replace.hint` says what happens to what people signed before.

## What changed

Read against the words each bundle already uses on the same screens (`policies.*`, `programs.review.policies`, `trips.added.policies.title`). **Kept as written:**
pt-BR except one phrase. **Changed:**

- **zh-CN** — "政策" → "规定" (the bundle's word for a policy a program asks people to sign: "添加一份规定", "参与者规定"; "隐私政策" stays for the privacy policy). Spaces around
  numbers and Latin words removed like the rest of the bundle ("5个文件", "PDF", "第{version}版"). "无法添加这份规定", "请检查网络后再试一次。", "替换这份规定".
- **zh-HK** — written Cantonese ("呢項", "揀", "冇", "嘅", "佢", "唔再") → the bundle's written style; "政策" → "守則" (the bundle's word); "打開" → "開啟"; "加入" → "新增"; "正在儲存……"
  like `join.saving`. "未能新增這份守則", "請檢查網絡後再試一次。沒有新增任何內容。", "取代這份守則".
- **ru** — "политику" / "этот документ" → "правила": the bundle says "правила" for a policy everywhere else ("Добавить правила", "Ваши правила"), and calls the same thing a
  "документ" in one error title and a "политика" in another. "Заменить эти правила"; "Для одних правил можно выбрать не больше 5 файлов."; "…попробуйте ещё раз…".
- **es** — tú → usted on the program lead's screen ("Elija", "Use", "Revise su conexión", "Agregue la nueva versión"), "la gente" → "las personas" (the bundle's word).
- **pt-BR** — "as pessoas serão convidadas a assiná-la de novo" read as optional; the English says they are *asked* to: "será pedido às pessoas que a assinem de novo".
- **ar** — diacritics dropped like the rest of the bundle ("تعذرت", "تحقق", "مجددًا" → "مرة أخرى"); "جارٍ الحفظ" → "يتم الحفظ" (`join.saving`); "لم تُضف أي شيء" (read without
  its diacritic as "you did not add") → "لم تتم إضافة أي شيء"; "لا تُعدَّل السياسة" (same problem) → "لا يمكن تعديل السياسة".

Re-acked (`copy:ack`); config 1047 green; English untouched.

### Second batch, after merging `main` (D-485 part 2: members sign)

Five more strings came in with part 2: the new transparency line `transparency.canSee.signed` ("The policies you sign for a program, and the day you signed. A program you joined
sees this too.") and the member's signing screen, `memberPolicy.record`, `.readPages`, `.record.meaning`. Kept as written: pt-BR; es on the member's own signing screen (tú, like
`memberPolicy.yourSignature`: "Tu firma"). Changed:

- **es** `transparency.canSee.signed` — tú → usted: the transparency screen is usted all the way down ("Sus puntos", "Cuándo guarda un lugar nuevo… Un programa donde se inscribió también lo ve."), and the
  line copies the sentence before it.
- **zh-CN / zh-HK** — 你 → 您, 政策 → 规定 / 守則, Cantonese → written Chinese ("您為某個計劃簽署的守則，以及簽署的日期。您加入的計劃也會看到這項。"), "在這裏簽名，就是您已閱讀並同意的記錄。"
- **ru** — "политики" → "правила".
- **ar** — "السياسات التي توقّعها" can be read as "the policies you expect" (the present tense of "to sign" and of "to expect" are the same letters); now "التي توقع عليها … مع التاريخ", which only means signing.

## What was wrong, and what missed it

The same as the program switch: a draft follows the English and the neighbouring keys of the same *file*, so it can use a different word for the same thing in the same screen
(Russian called one policy three things; Chinese used the privacy-policy word for a program's policy) and a different voice from the program lead's screens. The ledger
only checks that a translation follows its English.

## Decisions made

None: a review of drafts.

## Verified

First batch on `bb18d8c` (main `c652a30` plus this): browser suite **984 passed, 18 skipped**, fit audit on the 14 stories with "polic" in their id: 0 new. Both batches on `b0fc4ba`
(main `c8efcb7` plus this): `@pam/config` 1049 tests, `copy:status` in step, the browser suite on all three viewports **993 passed, 18 skipped** (11.3 min), Storybook builds, the fit audit on the
policy stories (14 × 8 languages): 0 new, and on "What others can see" and its nested-page twin (2 × 8): 0 new.

## Found, not applied (a promise: Will's, through the merge desk)

**The privacy page does not say Pam keeps the signed policies and the signature.** `privacy.s.what-we-keep.p2` lists "What you sign up for, the visits you plan, whether you went,
and the points you earn." D-485 keeps, per member, each policy they signed with the day, and their **signature picture**, privately: only the member sees the picture; a program
sees the first name and the date. The transparency screen now says the program sees the policy and the day; the privacy page says nothing about keeping either. Proposed English
(a new last paragraph of "What we keep", or an addition to p2): *"When you sign a program's policy, we keep it with the day you signed and your signature. Only you can see your
signature. The program sees that you signed, and the day."* Not applied.

## Left undone

- Piper's review queue (about 38) and the honest booking (2) are not on `main` yet.
- A native reader for the six (before-launch).

## Needs a human

Nothing.
