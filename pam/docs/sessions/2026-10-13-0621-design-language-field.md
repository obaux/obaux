# 2026-10-13 — design language field

**Branch:** `claude/pam-design-button-counter` · **Lane:** Design systems

## What changed
`packages/ui/src/LanguageField.tsx` (a `Dropdown` of languages, own names, English tags in the open list, `lang` per row) and its stories. JoinScreen is Ava's and was not committed; I swapped it locally only to take the pictures.

## What was wrong, and what missed it
Seven chips took most of the Join screen.

## Decisions made
D-561.

## Verified
tsc; looked at the Join screen with the field closed and open in English, Arabic, dark, and Spanish at 320.

## Left undone
Ava puts it on Join and moves the chips' tag test to the list rows.

## Needs a human
Nothing.
