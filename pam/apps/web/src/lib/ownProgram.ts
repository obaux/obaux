import type { ProgramDetails } from './useJoin';
import { toE164 } from './usePhoneSignIn';

/**
 * A program lead's own listing, as the database holds it (D-447, before-launch
 * "Load a program lead's own program"). The pure half: the columns read, the
 * shape the screens use, and what a save or a send writes. `useOwnProgram`
 * does the asking.
 *
 * One lead, one program, for now. Switching between several is a later step
 * (D-318); the newest row of the lead's organisation is the one shown.
 */
export const OWN_PROGRAM_COLUMNS =
  'id, name, category, subcategory, description_plain, address, phone, website, needs_review, is_active, created_at';

export interface OwnProgramRow {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly subcategory: string | null;
  readonly description_plain: string | null;
  readonly address: string | null;
  readonly phone: string | null;
  readonly website: string | null;
  readonly needs_review: boolean;
  readonly is_active: boolean;
  readonly created_at: string;
}

/** What a lead sent for checking (`program_submissions`, D-462). */
export const SUBMISSION_COLUMNS = 'id, service_id, kind, status, details, sent_at, changes_note';

export interface SubmissionRow {
  readonly id: string;
  /** The program it is about (a lead can have several, D-318). */
  readonly service_id?: string;
  readonly kind: 'new' | 'change';
  readonly status: 'in_review' | 'changes_asked' | 'approved' | 'withdrawn' | 'discarded';
  readonly details: Readonly<Record<string, unknown>>;
  readonly sent_at: string;
  readonly changes_note: string | null;
}

/** A live program's new name or address, waiting for Pam beside the live one (D-447). */
export interface PendingChange {
  readonly id: string;
  readonly name: string | null;
  readonly address: string | null;
  readonly sentAt: string;
}

export interface OwnProgram {
  readonly id: string;
  /** In the shape the wizard, "What you sent" and the Program tab already use. */
  readonly details: ProgramDetails;
  /** Approved and visible to members: not waiting on Pam. */
  readonly isLive: boolean;
  /** When it was sent for review (the submission's, else the row's creation), for "taking longer". */
  readonly sentAt: string;
  /**
   * The first check, while it is open: its id (to withdraw — "Delete and start
   * over", D-385) and Pam's note when it asked for changes. Null for a program
   * that predates the review record, or one already live.
   */
  readonly submissionId: string | null;
  readonly changesNote: string | null;
  /** A live program's change waiting for Pam, if there is one. */
  readonly pendingChange: PendingChange | null;
}

const text = (value: unknown): string | null => (typeof value === 'string' && value !== '' ? value : null);

/**
 * A program as the database holds it. `submissions` are the open ones for it
 * (`in_review` / `changes_asked`): a `new` one is the first check, a `change`
 * one is a live program's change waiting beside it.
 */
export function programFromRow(row: OwnProgramRow, submissions: readonly SubmissionRow[] = []): OwnProgram {
  const first = submissions.find((s) => s.kind === 'new') ?? null;
  const change = submissions.find((s) => s.kind === 'change') ?? null;
  return {
    id: row.id,
    submissionId: first?.id ?? null,
    changesNote: first?.status === 'changes_asked' ? first.changes_note : null,
    pendingChange: change
      ? { id: change.id, name: text(change.details['name']), address: text(change.details['address']), sentAt: change.sent_at }
      : null,
    details: {
      name: row.name,
      category: row.category,
      subcategory: row.subcategory ?? '',
      description: row.description_plain ?? '',
      address: row.address ?? '',
      phone: row.phone ?? '',
      website: row.website ?? '',
      // The services a program offers are kept on the device until they have
      // a table of their own (D-313).
      services: [],
    },
    isLive: !row.needs_review && row.is_active,
    sentAt: first?.sent_at ?? row.created_at,
  };
}

const blank = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/**
 * A phone number as the database keeps it (+ and digits). A number that does
 * not parse is passed on as typed, so the database's own rule names it rather
 * than this quietly dropping what somebody entered.
 */
export function phoneForDatabase(typed: string): string | null {
  const trimmed = blank(typed);
  if (trimmed === null) return null;
  return toE164(trimmed) ?? trimmed;
}

/** The arguments of `submit_program` (20261010042108). */
export function submitArguments(details: ProgramDetails): Record<string, string | null> {
  return {
    p_name: details.name.trim(),
    p_category: details.category,
    p_subcategory: blank(details.subcategory),
    p_description: blank(details.description),
    p_address: blank(details.address),
    p_phone: phoneForDatabase(details.phone),
    p_website: blank(details.website),
  };
}

/** The arguments of `resend_program_submission` (20261010135742): the same words as a send, for the submission being corrected. */
export function resendArguments(submissionId: string, details: ProgramDetails): Record<string, string | null> {
  return { p_id: submissionId, ...submitArguments(details) };
}

/** What an edit may write. */
export interface EditableProgram {
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly address: string;
  readonly phone: string;
  readonly website: string;
}

/**
 * The columns an edit writes (D-447). A live program's name, address and
 * category are not edited in place, so they are left out of the update — the
 * database refuses them too — while its description, phone and website are the
 * lead's to change at once. One still waiting for review may change anything.
 */
export function editColumns(draft: EditableProgram, isLive: boolean): Record<string, string | null> {
  return {
    description_plain: blank(draft.description),
    phone: phoneForDatabase(draft.phone),
    website: blank(draft.website),
    ...(isLive
      ? {}
      : { name: draft.name.trim(), category: draft.category, address: blank(draft.address) }),
  };
}

/**
 * What to ask Pam to change on a live program (`request_program_change`,
 * D-447): its name or address, when they differ from the live ones. Null when
 * neither does — then nothing waits for Pam and the edit is only the words,
 * phone and website, which apply at once.
 */
export function changeRequest(
  program: OwnProgram,
  draft: EditableProgram,
): { readonly name: string; readonly category: string; readonly subcategory: string | null; readonly address: string | null } | null {
  const name = draft.name.trim();
  const address = blank(draft.address);
  if (name === program.details.name && address === blank(program.details.address)) return null;
  return { name, category: program.details.category, subcategory: blank(program.details.subcategory), address };
}
