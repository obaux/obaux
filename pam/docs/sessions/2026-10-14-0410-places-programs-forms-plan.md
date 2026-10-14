# 2026-10-14 — places-programs forms plan

**Branch:** `claude/places-programs-forms-plan` · **Lane:** Places & programs (Piper)

## What changed

One document, no code: `docs/research/2026-10-14-forms-and-docusign-plan.md`. How Will's 14 October note (DocuSign, or filling and signing PDFs inside Pam, Pam storing none of the details) meets D-485/D-489 program policies.

## What was wrong, and what missed it

Nothing built. Found while reading: today Pam stores a drawn signature picture for every policy a member signs (`policy_signatures.image`, `member_signatures`), which conflicts with the new rule if "signatures" is on the not-stored list. Raised as question 3.

## Decisions made

None. Recommendation only: DocuSign first, forms as a second `kind` of policy, provider interface with a stub.

## Verified

Read the migrations, D-485, D-489, the policy screens and hooks, the host guard test. DocuSign facts are from memory and marked for Iris.

## Left undone

Everything in the plan, until Will answers the eight questions.

## Needs a human

Will: questions 1–3 and 8. Lena: 2 and 7. Iris: 5 and 6.
