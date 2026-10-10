import type { DummyService } from '@pam/config/dummy-services';
import type { WeekHours } from '@pam/config/hours';
import { phoneForDatabase } from './ownProgram';

/**
 * The services a program offers, as the database holds them (`program_services`,
 * D-462; the shape of D-313). The pure half: the columns read, the shape the
 * screens already use (`DummyService`, the example set's), and what a save
 * writes. `useServices` does the asking.
 *
 * A real service's `policyIds` are the policies that are only for it
 * (`program_policy_services`, D-313 step 2, migration 20261010151302); a policy
 * no service names is the program's, asked of everyone, as the example set says.
 */
export const PROGRAM_SERVICE_COLUMNS =
  'id, service_id, name, description, phone, website, address, hours, sort_order, program_policy_services(policy_id)';

export interface ProgramServiceRow {
  readonly id: string;
  readonly service_id: string;
  readonly name: string;
  readonly description: string | null;
  readonly phone: string | null;
  readonly website: string | null;
  readonly address: string | null;
  readonly hours: unknown;
  readonly sort_order: number;
  /** The policies that are only for this service (D-313 step 2); none named is none. */
  readonly program_policy_services?: readonly { readonly policy_id: string }[] | null;
}

/** A row of `program_services` in the shape every screen that lists services reads. */
export function serviceFromRow(row: ProgramServiceRow): DummyService {
  return {
    id: row.id,
    placeId: row.service_id,
    name: row.name,
    description: row.description ?? '',
    phone: row.phone,
    website: row.website,
    address: row.address,
    hours: Array.isArray(row.hours) ? (row.hours as WeekHours) : null,
    policyIds: (row.program_policy_services ?? []).map((link) => link.policy_id),
  };
}

const blank = (value: string | null | undefined): string | null => {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : trimmed;
};

/** What a save writes. The program it belongs to is `service.placeId`. */
export function serviceColumns(service: DummyService): Record<string, unknown> {
  return {
    service_id: service.placeId,
    name: service.name.trim(),
    description: blank(service.description),
    phone: phoneForDatabase(service.phone ?? ''),
    website: blank(service.website),
    address: blank(service.address),
    hours: service.hours ?? null,
  };
}
