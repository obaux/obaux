# The help request: what the "Still stuck?" form posts, and what comes back

For Wren, who builds the form on joinpam.org (A28, D-521). The function is `help-request`; it is **built off** and answers
503 `{"live": false}` until it is switched on. It is not a way to reach a person any faster than the help desk: the form
should appear after the answers (at the end of a post, and when a search finds nothing).

## Request

`POST https://shobqzuhicoiymtumiaz.supabase.co/functions/v1/help-request`
`Content-Type: application/json`. Sent from a page on `https://joinpam.org` or `https://www.joinpam.org` (any other origin
is refused; the browser sends `Origin` itself). Browsers send a preflight `OPTIONS` first; the function answers it.
No login and no key are needed (the function is deployed with JWT verification off).

| Field | Required | Limit | Meaning |
|---|---|---|---|
| `message` | yes | 3,000 characters | What the person typed |
| `email` | yes | 254, one valid address | Where Will answers; becomes the reply-to |
| `name` | no | 100 | What to call them |
| `page` | no | 300 | The path or title of the page they came from (e.g. `/support/posts/where-is-my-program`) |
| `lang` | no | 16 | The language they read in (e.g. `es`, `zh-HK`) |
| `role` | no | 40 | Their role if the site knows it (the site usually does not) |
| `roles` | no | an array of up to 10 | Who they say they are, from the form's "choose all that apply": any of `member`, `program`, `case_manager` ("Case manager" with a space is read the same). Repeats and anything else are dropped, not refused; a value that is not an array is refused (`field: "roles"`). It is shown in the email as "Says they are: a member and a case manager" and goes nowhere else: not stored, not logged, not in the subject or the duplicate check |
| `website` | **honeypot** | – | A field no person sees: hide it with CSS (not `type=hidden`), `tabindex=-1`, `autocomplete=off`. Send it empty. A filled one is treated as a bot: the reply says `ok` and nothing is sent |

Unknown fields are ignored. The whole body may be at most 12,000 characters. Control characters are stripped.

## Responses (JSON)

| Status | Body | What the form does |
|---|---|---|
| 200 | `{"ok": true}` | Say it was sent |
| 400 | `{"error": "invalid", "field": "message" \| "email" \| "name" \| "page" \| "lang" \| "role" \| "roles" \| "body"}` | Point at that field |
| 403 | `{"error": "not allowed from here"}` | Only from joinpam.org; show the address |
| 413 | `{"error": "too_large"}` | Show the address |
| 429 | `{"error": "rate_limited"}` (`Retry-After: 3600`) | Three a person an hour, thirty in all. Show the address |
| 502 | `{"error": "send_failed"}` | Show the address |
| 503 | `{"live": false}` | **Not switched on.** Show `hello@joinpam.org` instead of the form |
| network error / 500 | – | Show the address |

Every failure path falls back to showing `hello@joinpam.org`, so nobody is left with nothing (§0). "Live" is learned by
asking: the first `503 {"live": false}` means show the address. There is no separate status call.

## The phone field (the text reply, later)

Will said yes to a phone number so he can text back. It is built after this and works only while Pam's texts are on. The form
learns that by reading one setting, which anyone may read:
`GET https://shobqzuhicoiymtumiaz.supabase.co/rest/v1/app_settings?key=eq.texts_live&select=value` with the project's
public (anon) key in `apikey`. `[{"value":"on"}]` means show the field; anything else, or a failure, means hide it. The
function will accept an optional `phone` field then; today it ignores it.

## What lands in Will's inbox

One email, from Pam's address to `hello@joinpam.org`, reply-to the person: what they typed, how to answer them, the page,
who they say they are (member, program, case manager), the language, the role if known. Nothing from the database: the function reads no member records.
