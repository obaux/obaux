'use client';

import { createContext } from 'react';

/**
 * Where a status `Notice` goes when the app has a toast for it (D-619; Will, 19 October: "I want to stop using this style. Please use
 * the toast banner instead."). The app provides a sink; a status `Notice` registers what it says with it and draws nothing in place, and
 * takes it away when it unmounts, which is how a lasting state's toast goes when the state does. The app draws the toast, and a stand-in
 * of the same look and place until the toast has loaded (or if it cannot, offline), so there is never a state with nothing said. With no
 * sink at all (packages/ui tests, the Notice stories) the `Notice` draws its card.
 */
export interface NoticeToastSpec {
  readonly status: 'error' | 'warning' | 'info';
  readonly title: string;
  readonly body: string | undefined;
  /** The support action, "Contact Pam": a link to Help (A28). */
  readonly contact: { readonly label: string; readonly href: string } | null;
  readonly retry: { readonly label: string; readonly onPress: () => void } | null;
  /** D-432: the support action reads as a link, not a button. */
  readonly quiet: boolean;
  /** A one-off the person may close. A state that lasts has no close and goes when the state ends. */
  readonly closable: boolean;
}

export interface NoticeSink {
  readonly register: (id: string, spec: NoticeToastSpec) => void;
  readonly unregister: (id: string) => void;
}

export const NoticeSinkContext = createContext<NoticeSink | null>(null);
