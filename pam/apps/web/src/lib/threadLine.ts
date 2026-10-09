import type { Role } from '@pam/config';

/**
 * The line under the name in a conversation's header (D-395): who this
 * person is to you, and the place when they run a program — "Program lead
 * at Example Food Pantry". It has the whole width under the name, so a
 * program's name is no longer cut to a word in a chip beside it (Will,
 * 8 October).
 *
 * The same audience rules the chip had (D-187, D-262): a member sees who
 * their case manager or program lead is; the Pam team is named as such; the
 * super admin, who talks only to staff, sees which kind; staff looking at a
 * member see nothing.
 */
export function threadLineFor(
  viewer: Role | null,
  other: { readonly role: Role | null; readonly programName: string | null } | null,
  t: (key: string, vars?: Record<string, string>) => string,
): string | null {
  if (!other?.role) return null;
  if (other.role === 'super_admin') return t('role.pamTeam');
  if (viewer !== 'member' && viewer !== 'super_admin') return null;
  if (other.role === 'provider') {
    return other.programName ? t('messages.thread.leadAt', { program: other.programName }) : t('messages.thread.lead');
  }
  if (other.role === 'admin') return t('role.admin');
  return null;
}
