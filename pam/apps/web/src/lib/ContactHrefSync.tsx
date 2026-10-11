'use client';

import { useEffect } from 'react';
import { SITE_URL } from './project';
import { useSession } from './useSession';

/**
 * Where "Contact Pam" goes (A28, Sage's words §1): Help when somebody is signed in, and the help desk on the
 * website when they are not. A sign-in error or a paused account shows the button to somebody who cannot get in,
 * and Help is a screen of the app; the desk is a page anyone can open. Loaded after mount, like `LocaleSync`, so
 * no route pays for `useSession` before it needs it. Until it has run, `Notice` goes to Help, which works
 * signed out too.
 */
export function ContactHrefSync({ set }: { readonly set: (href: string) => void }) {
  const { state: session } = useSession();
  const signedIn = session.status === 'signed-in';
  const settled = session.status !== 'loading';
  useEffect(() => {
    if (!settled) return;
    set(signedIn ? '/help/' : `${SITE_URL}/support/`);
  }, [signedIn, settled, set]);
  return null;
}
