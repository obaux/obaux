'use client';

import type { Role } from '@pam/config';
import { SESSION_CHANGED } from './useSession';

/**
 * One account, two roles (0078, D-374): a member who also works at a program
 * uses Pam as one or the other. The database keeps which (`switch_role`);
 * every screen's session reads again when it changes.
 */
export async function switchRole(role: Role): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('switch_role', { p_role: role });
    if (error) return false;
    window.dispatchEvent(new Event(SESSION_CHANGED));
    return true;
  } catch {
    return false;
  }
}

/** Adds the program role an invite was made for to this account (0078). */
export async function addRoleFromInvite(code: string): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('add_role_from_invite', { p_code: code });
    if (error) return false;
    window.dispatchEvent(new Event(SESSION_CHANGED));
    return true;
  } catch {
    return false;
  }
}
