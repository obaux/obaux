# A case manager asks to join from the website (D-568)

`claude/pam-case-manager-request`, 390 wide, light and `-dark`. Supabase stubbed; the names and the email are examples.

| File | Screen |
|---|---|
| 01-phone-first | `/join/case-manager/` signed out: what it is, then the phone and the code |
| 02-about-you | Signed in, no account: name, city (the served list), where you work, work email |
| 03-email-problem | An email that does not look like one, caught before sending |
| 04-sent | Sent: a person on the Pam team checks it; come back and sign in to see the answer (no text promised) |
| 05-still-checking-from-join | A sign-in that asked, opening `/join/`, is sent here, not into member setup |
| 06-refused | Refused: Ask again, or Contact Pam |
| 07-ask-again | Ask again fills in what they sent before (not the email) |
| 08-has-account | Somebody with an account is told to contact Pam |
| 09-requests-list | The super admin's Requests: where they work in the row |
| 10-request-review | The request: "Works at" and "Work email" |
