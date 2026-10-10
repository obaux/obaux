'use client';

import { useEffect, useState } from 'react';
import { ROLES, type Role } from '@pam/config';

/**
 * Which role's screen a super admin is looking at.
 *
 * **A rendering choice, not an identity.** This changes which arrangement of
 * the screen is drawn; it never changes who the queries run as. A super admin
 * viewing "as a member" is looking at their own account in a member's layout,
 * under exactly the same row-level rules as before — the database does not know
 * this setting exists, and cannot be made to by editing this file.
 *
 * Kept in `sessionStorage` rather than the URL or the database: it should
 * survive a refresh while somebody is checking a screen, and should be gone the
 * next time they open Pam, because the normal state is your own role. A URL
 * parameter would also mean a shared link could put somebody in a view they did
 * not choose.
 *
 * Ignored for everybody who is not a super admin, at the point of use.
 */
const KEY = 'pam.view-as';
/**
 * Said on `window` when a view is chosen, so every screen part that asked the
 * question follows. Several parts of one page call this hook (Home picks its
 * arrangement, the switcher sits in a header inside it): without this the one
 * that was changed drew the new role and the rest kept drawing the old.
 */
const CHANGED = 'pam:view-as';

function readStored(): Role | null {
  try {
    const saved = sessionStorage.getItem(KEY);
    return saved && (ROLES as readonly string[]).includes(saved) ? (saved as Role) : null;
  } catch {
    // Private mode, or storage turned off. The default view is the right one.
    return null;
  }
}

export function useViewAs(ownRole: Role | null): {
  viewAs: Role | null;
  setViewAs: (role: Role) => void;
} {
  const [viewAs, setStored] = useState<Role | null>(null);

  useEffect(() => {
    if (ownRole !== 'super_admin') return;
    setStored(readStored());
    const follow = (event: Event) => setStored((event as CustomEvent<Role>).detail);
    window.addEventListener(CHANGED, follow);
    return () => window.removeEventListener(CHANGED, follow);
  }, [ownRole]);

  const setViewAs = (role: Role) => {
    setStored(role);
    try {
      sessionStorage.setItem(KEY, role);
    } catch {
      // Not persisting is survivable; not switching would not be.
    }
    window.dispatchEvent(new CustomEvent<Role>(CHANGED, { detail: role }));
  };

  return { viewAs: ownRole === 'super_admin' ? viewAs : null, setViewAs };
}
