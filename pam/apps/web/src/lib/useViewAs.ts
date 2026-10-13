'use client';

import { useEffect } from 'react';
import type { Role } from '@pam/config';

/**
 * Which role's screen a super admin was looking at, back when they could choose (D-108).
 *
 * The choice lived in `sessionStorage`; it was a rendering choice, never an identity, and
 * the database never knew it existed. Retired with its switcher (D-558).
 */
const KEY = 'pam.view-as';

/**
 * Its screen and its switcher are gone (D-558), so nothing sets a preview any more, and a
 * value a tab still holds from before is cleared rather than obeyed: a super admin whose
 * tab was previewing "Member" would otherwise land as a member with no way back. The hook
 * keeps its shape so the screens that ask it need not change; it always answers "your own
 * role".
 */
function forgetStored(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Private mode, or storage turned off. Nothing to forget.
  }
}

export function useViewAs(ownRole: Role | null): {
  viewAs: Role | null;
  setViewAs: (role: Role) => void;
} {
  useEffect(() => {
    if (ownRole === 'super_admin') forgetStored();
  }, [ownRole]);

  return { viewAs: null, setViewAs: () => {} };
}
