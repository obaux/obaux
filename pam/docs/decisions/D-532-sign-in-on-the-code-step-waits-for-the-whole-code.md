# D-532 — Sign in on the code step waits for the whole code

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-b15-polish`

## Decided

Iris (b15, C1), relayed by Mira: on "Enter your code", Sign in turned on after one digit. A short code was sent to Supabase and came back as the "wrong code" alert; there is no "the code has six numbers" message. So the button is off until all six digits are in (`PhoneSignInCard`, `CODE_LENGTH = 6`, counting digits, so Arabic-Indic digits count too). Typing the sixth digit still submits by itself (D-251), as before.

## Why

A button that can only produce "wrong code" for a code that cannot be right tells a person they made a mistake they did not make. No new words were needed.

## What a later session might reverse

If Supabase ever sends codes of another length, change `CODE_LENGTH` (and the boxes follow, they take it as `length`).
