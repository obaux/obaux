'use client';

import { useEffect } from 'react';
import { SITE_URL } from './project';
import { usePamStatus } from './pam';
import { useSession } from './useSession';

/**
 * Where "Contact Pam" goes (A28, Sage's words §1): Help when somebody is signed in (their conversation with Pam when that is on, D-605), and the help desk on the
 * website when they are not. A sign-in error or a paused account shows the button to somebody who cannot get in,
 * and Help is a screen of the app; the desk is a page anyone can open. Loaded after mount, like `LocaleSync`, so
 * no route pays for `useSession` before it needs it. Until it has run, `Notice` goes to Help, which works
 * signed out too.
 */
export function ContactHrefSync({ set }: { readonly set: (href: string) => void }) {
  const { state: session } = useSession();
  const signedIn = session.status === 'signed-in';
  const settled = session.status !== 'loading';
  // Signed in with messaging Pam on (D-605): Contact Pam opens the person's conversation with Pam, and Help's "Write to Pam" is
  // the same place. The Pam team are Pam; for them, off, or signed out it is what it was.
  const pam = usePamStatus(signedIn && session.status === 'signed-in' && session.session.role !== 'super_admin');
  const pamLive = pam.status === 'ready';
  useEffect(() => {
    if (!settled) return;
    set(signedIn ? (pamLive ? '/messages/pam/' : '/help/') : `${SITE_URL}/support/`);
  }, [signedIn, settled, pamLive, set]);
  return null;
}
