# 2026-10-11 — Voice & UX copy: Will's website words, and the first pass in his component

**Branch:** `claude/voice-marketing-words` · **Lane:** Voice & UX copy (Sage)

## What changed

- **Figma, Will's Callout card component (18:517), all six variants.** The quote ("…and remember to go") is
  replaced by a line and a supporting sentence for each chip. They are Will's picks from the options I
  proposed, in his marketing words ("residents" instead of "members"). The supporting sentence is a second
  paragraph in the same text layer, in his Lead style, so the component's structure is unchanged. Longer
  words made the phone variants taller, so I spaced them so they don't overlap inside the set. Chips are
  unchanged (Residents / Program Providers / Case managers).
- **`docs/voice.md`:** an app-vs-website word table (Will's words, quoted), a "How we work on words"
  section (writing into his component; no translation while words are in Figma), and the checklist and
  word list brought in line. D-505.
- The "Copy proposals" page in Figma stays as a sketch. Nobody builds from it.

## What was wrong, and what missed it

- The longer text made the three phone variants grow (546 → 576/601px), and the component set's fixed
  positions stacked them over each other. A screenshot caught it; nothing else would have.
- The Residents headline ran to three lines on Desktop and touched the chips. I shortened it to "Find
  help, plan your visit, and talk to a real person."

## Decisions made

- D-505 (Will's): website words, writing in his component, translate after merge.

## Verified

| Check | Result |
|---|---|
| Component screenshot after the change | all six variants read in full; no overlap; nothing clipped |
| `docs/voice.md` only | no build impact |

## Left undone

- Help-centre search phrases (Will, 01:24, with Wren): next job, its own branch.

## Needs a human

- None for this branch. Will may want to adjust the component; it's his.
