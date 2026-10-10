# D-482 — The privacy page says a mail company gets the address and the email, and may not use them for anything else (a21, Will)

**Date:** 2026-10-10 · **Branch:** `claude/lena-mail-service-privacy`

Will approved this English on 10 October 2026 at 14:37 UTC, in the Control Room ("Approve", item a21), relayed by the merge desk (Mira):

> When Pam emails a case manager or a program, a company that sends email for us gets the email address and the email. It may not use them for anything else.

It is signed as his: the sentence is **word for word** `privacy.s.sharing.p4` in `en.json`, and `test/legal.test.ts` ("the mail service, said before
the first email goes out") fails if the English is changed without him. It is the **fourth and last paragraph of "Who else gets your information"**
(`privacy.s.sharing`, after the one about the company that sends our texts and the one that stores our data), so the section's count in `legal.ts` is 4.

**Why now.** Will set up the email service (Resend) on 10 October. The page has to say this before the first email goes out; the email sender is
off until forwarding, a test and his go (D-450), so this lands first and ships with the next deploy.

**The six translations** (mine, not yet read by a native speaker; promises need one, `docs/before-launch.md`):
es "Cuando Pam envía un correo electrónico a un gestor de casos o a un programa, una empresa que envía correos para nosotros recibe la dirección y el mensaje. No puede usarlos para otra cosa."
pt-BR "…uma empresa que envia e-mails para nós recebe o endereço de e-mail e a mensagem. Ela não pode usá-los para mais nada."
zh-CN "当Pam给个案管理员或项目发送电子邮件时，替我们发送邮件的公司会收到电子邮件地址和邮件内容。它不得将这些用于其他任何用途。"
zh-HK "當Pam向個案經理或計劃發送電郵時，替我們發送電郵的公司會收到電郵地址和電郵內容。它不得將這些用於任何其他用途。"
ru "Когда Pam отправляет письмо кейс-менеджеру или программе, компания, которая отправляет письма для нас, получает адрес электронной почты и само письмо. Она не имеет права использовать их ни для чего другого."
ar "عندما ترسل Pam بريدا إلكترونيا إلى مدير حالة أو إلى برنامج، تحصل الشركة التي ترسل لنا البريد الإلكتروني على عنوان البريد والرسالة نفسها. ولا يحق لها استخدامهما في أي شيء آخر."
They use each bundle's own words for a case manager, a program and email, and the same "may not use it for anything else" as the paragraph before.

## Two things the sentence does not cover, put to Will through the merge desk (not changed here)

Mira asked whether the sentence still covers the expired-link email (D-476). It does not, and a second line on the same page is now untrue:

1. **Who gets an email.** The expired-link page asks the person holding the link for their address (`invite.expired.email`, "We only use it to send the
   link"), and the sender mails it for a case manager, a program **or a member** (D-476: "a member's expired link is emailed too"). "A case manager or a
   program" leaves the member out. Proposed English, for Will: *"When Pam sends an email, a company that sends email for us gets the email address and
   the email. It may not use them for anything else."* — it covers every email Pam sends now and later.
2. **"Members are never asked for an email."** (`privacy.s.what-we-keep.p7`, the last sentence): a member whose link ran out is asked, on that page.
   The address is kept in `invite_emails` (an outbox: no client can read it; the super admin's invites log shows the address a link went to; it is not
   deleted when the email is sent). Proposed English for the sentence, for Will: *"Members are asked for an email only if their invite link has run
   out and they want a new one by email. We use it only to send that link."* If the address should be deleted once it is sent, that is a database change
   to decide first, and the sentence says so after.

**What a later session might reverse:** the paragraph's place (it could be its own section when there is more to say about email); nothing in the wording
without Will.
