# D-618 — D-618 The failure banner takes the alert banner's style, and says how to put it right

**Date:** 2026-10-19 · **Branch:** `claude/pam-design-malfunction-banner`

Will, 19 October, 00:13 (Control Room), via the merge desk: *"for the error banner please use the other alert banner style (ensure it fits properly on screen), and if saying something didn't work, please let users know how to resolve it … contact pam as a last resort (but don't explicitly state that)."*

## Decided

1. **The banner's style is the alert banner's** (`AlertBannerHost`, Will 16 September): a solid error ground with its own text colour, a title, a line, an action and a close, `role="alert"`. It keeps D-617's place (the bottom, above the tab bar, safe area and keyboard; Will 18 October 21:14) and its rules: never over the failed control, no timer, gone at the next tap or key (outside the banner), a good retry, or leaving the screen, announced once.
2. **Its place differs from the banner at the top on purpose.** `AlertBannerHost` records Will, 17 September, "on top of the page, so it doesn't overlap with navigation, or logo". That was for a banner raised from outside a screen. His 21:14 word for malfunctions is the bottom overlay; it is newer and about this alert, so it wins, and the style is borrowed, not the place.
3. **It says how to put it right.** "Try again" when the caller can run the action again (`show(action, error, control, { retry })`); "Sign in" when the failure is a signed-out one, sending the person to Sign in and back to this screen where Sign in's short list of way-ons allows it (`signinNext`), Home otherwise; and "Get help" (opening `/help/`) when the same action fails a second time in a row. Contact Pam is the last resort and is never said in those words (Will).
4. **Taps inside the banner are its own.** The next-tap rule would have removed a button before its click; it ignores taps and keys inside the banner, and Tab only moves toward the buttons.
5. **Lazy.** The banner's render loads the first time a failure is shown, like the banner at the top, so the root bundle carries only the logic (the budget spare went from 6.0 to 5.4 kB).
6. **`show(action, error, control)` keeps its signature**; `retry` is an optional fourth argument, so callers from before D-618 show no button.

## Words and kinds

The words are Sage's, signed at `ab6b9cc4` and mapped to keys at `6905e0e3` (`docs/signed-english.md`): `notice.malfunction.<kind>.title` / `.body` for the eight kinds, `notice.malfunction.again.body` for the second failure, `notice.malfunction.action.{retry,signIn,reload,help}` ("Show the latest" for reload). The kind comes from Nico's `failureKindOf` (`claude/messages-failure-kinds` @ `aed95a9c`, merged). The way out per kind is Sage's: Try again for offline, timeout and server (when the caller gave a retry), Sign in for signed-out, Show the latest for changed, none for not-allowed, too-many and gone; Get help on the second failure of the same action.

**Until Lena puts the keys in the bundles** a kind with no key says `notice.malfunction` and shows no body, and a button with no key shows only if a word already signed exists for it (Try again, Sign in, Get help); Show the latest has none yet, so that button waits for its key. Nothing is added to `en.json` here.

## The banner must be there when the network is not

A failure is most often the network, so a banner that is fetched when it is needed would not come. It is fetched when the page is idle, and if it still could not be fetched a plain line of the same words on the same ground stands in. Found by a test that went offline before tapping.

## What a later session might reverse

The close button (part of that banner's style, and not a timer); showing "Get help" on the second failure and not the first.
