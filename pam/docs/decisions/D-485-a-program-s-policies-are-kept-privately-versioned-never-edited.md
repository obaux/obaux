# D-485 — A program's policies are kept privately, versioned, never edited

**Date:** 2026-10-10 · **Branch:** `claude/places-programs-policies-p1`

**Decided** by Will, 10 October 2026, 14:36 UTC, on card a25: "Go for it", agreeing all six of the CTO's recommendations.

1. **Signature picture.** Kept privately with the member's account and shown only to them. A program sees the member's first name and the date they signed. (Part 2.)
2. **Transparency.** One new line in the promise to members, shown before signing: a program keeps a record of the policies you sign, with the date. (Part 2; copy for Lena.)
3. **Never edited.** A policy is not changed once people can sign it. A new version replaces it, people are asked again, and the old signatures stay as the record. (`add_policy` with `p_replaces`; built in part 1.)
4. **Files.** PDFs or photos of each page, up to 10 MB each and 5 to a policy, kept in a private bucket. People who signed keep their copy when a program removes a policy. (Part 1.)
5. **Lawyer.** A lawyer reads the sentence about what a signature in Pam means ("a record that you read and agreed", not a legal signature) and the upload disclaimer before launch: `docs/before-launch.md`.
6. **A booking is never stopped by an unsigned policy.** Pam only reminds.

**Part 1 (this branch)** builds 3 and 4 in the database (`program_policies`, `program_policy_files`, `add_policy`, `archive_policy`, the private `policies` bucket, migration `20261010144052`) and a lead's own screens on them. Members see nothing new until signing (part 2) ships: showing them policies they cannot sign would be a promise with nothing behind it. Parts: 2 members sign; 3 who signed and the verified tick; 4 "only for this service".

**What a later session might reverse.** The 30-policies-a-program ceiling; a title taken from the first file's name (a title field may be wanted); archiving rather than deleting the files (storage grows).
