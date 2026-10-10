# D-490 — Will approves three privacy sentences: any email, the member's address deleted once sent, and the signature kept (card a29)

**Date:** 2026-10-10 · **Branch:** `claude/lena-privacy-three-sentences`

Will answered card a29 on 10 October 2026 at 15:15 UTC with one word, "approved", relayed by the merge desk. It covers three sentences, **word for word** (each is
pinned in `test/legal.test.ts`, which fails if the English is changed without him):

1. **`privacy.s.sharing.p4`**, replacing D-482's: "When Pam sends an email, a company that sends email for us gets the email address and the email. It may not use them
   for anything else." D-482's sentence (a21) said "a case manager or a program"; the expired-link email (D-476) is also sent to a member, so the sentence now covers every email Pam sends.
2. **The end of `privacy.s.what-we-keep.p7`**, replacing "Members are never asked for an email.": "Members are asked for an email only if their invite link has run out and they
   want a new one by email. We use it only to send that link, and delete it once it is sent." The deletion is Nico's D-487 (the address is removed from `invite_emails` as soon as the
   link is sent, or after seven days if it cannot be).
3. **New `privacy.s.what-we-keep.p8`**: "If a program asks you to sign its rules, we keep what you signed, the date, and your signature. Only you see your signature. The program sees
   only your first name and the date." It is D-485's point 1 (the signature picture is kept privately with the member's account and shown only to them; a program sees the first name and
   the date), written for the page that did not yet say it. It sits at the end of "What we keep" (the section's count in `legal.ts` is 8); no key already half-said it.

**The six translations** are mine, with no native reader (before-launch). They follow each bundle's own words: "enlace … venció" / "link … vencido" / 链接已过期 / 連結已過期 / срок истёк /
انتهت صلاحية الرابط for a run-out link (as on the expired-link page), and each bundle's **own word for a policy**, not the English "rules": es "políticas", pt-BR "políticas", zh-CN "规定", zh-HK "守則",
ru "правила", ar "سياسات", because that is the word on the signing screen the member has just used. (The English privacy sentence says "rules" and the app's English says "policy"
and "policies"; the English is Will's, so it stays, and the mismatch is for him: the post "Signing a program's rules" uses his word.)

**What a later session might reverse:** the place of the signature paragraph (it could move beside "Who can see it" when that section is next rewritten); the word "rules" against "policies" in the English.
