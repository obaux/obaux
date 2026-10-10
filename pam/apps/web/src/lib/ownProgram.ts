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

export interface OwnProgram {
  readonly id: string;
  /** In the shape the wizard, "What you sent" and the Program tab already use. */
  readonly details: ProgramDetails;
  /** Approved and visible to members: not waiting on Pam. */
  readonly isLive: boolean;
  /** When it was sent for review (the row's creation), for "taking longer". */
  readonly sentAt: string;
}

export function programFromRow(row: OwnProgramRow): OwnProgram {
  return {
    id: row.id,
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
    sentAt: row.created_at,
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
