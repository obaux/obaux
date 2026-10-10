# 2026-10-10 — website: help posts checked against Policies P1

**Branch:** `claude/compassionate-bohr-mzrchf` (main `c652a30` merged in) · **Lane:** Website

Mira (15:06): P1 is on main (D-485), a lead can now really add policies: check the help posts against it.

## What changed

- **What P1 is:** a program lead's own screens (add a policy as PDF/photos, versions, remove, replace) on real tables and a
  private bucket. Members and the example people still see the example policies; a real place shows none. Nothing for
  members to sign until part 2.
- **Planning a visit** said "Some places ask you to sign a policy before you go. If so, you will see "Policies to sign"
  on the place, and a "Sign" link on Trips." At tonight's deploy no real place asks, so this was a promise with nothing behind
  it. The paragraph now shows only when `SIGNING_LIVE` (the `program-rules-live` switch in `signed-off.json`) and then
  links to "Signing a program's rules".
- **Pam words, "Policy"** said "You sign it in Pam." Until then: "A document a program adds in Pam, to say what it asks of the
  people who take part."; the signing half returns with the switch.
- A test pins that both read the switch. before-launch lists both, and the post to write when part 2 lands: a short one for program
  leads, "Adding your program's policies", from the real screens (not now: a lead adding policies nobody can sign yet would be a
  how-to with nothing behind it).
- **Checked, unchanged:** Keeping your listing (draft; no policy mention), Joining as staff, One phone two sides, Sending an
  invite, Messages, Texts, Points, What others can see, Case manager assignments.
- **The rules post** ("For programs") matches D-485's six answers (first name and date only, a new version asks again, kept
  privately); it does not yet say that a removed policy keeps its signers' copies or the file limits: left for after part 2, when
  it can be checked against the real screens (before-launch).

## What was wrong, and what missed it

- Two posts (one I wrote on 10 October) described signing as something a member does, ahead of the feature; the About
  Pam and rules posts had a switch, these two did not. Found by reading P1's session ("Members see nothing new until
  signing ships").

## Decisions made

None new (D-485 is Piper's).

## Verified

- Site tests, tsc, normal build, `a11y.mjs` (numbers in the READY note).

## Left undone

- The leads' policies post and the rules post's final check wait for part 2. Unchecked: the deployed app.

## Needs a human

- Native readers for the six About Pam languages; a lawyer for "What your signature means".
