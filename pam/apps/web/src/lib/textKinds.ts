import { ALERT_TEXTS_LIVE } from './alertTextsLive';

/** Which kinds of texts the consent screens list for a kind of person, and whether each is sent today (D-608). See `TextKindsList`. */
export type TextKindsFor = 'member' | 'admin' | 'provider';

interface Kind {
  readonly key: string;
  readonly live: boolean;
}

/** The rows for one kind of person, whether each is sent today, and in the order they are shown. */
export function textKindsFor(who: TextKindsFor, textsLive: boolean): readonly Kind[] {
  const rows: Kind[] =
    who === 'member'
      ? [
          { key: 'reminders.what.1', live: false },
          { key: 'reminders.what.2', live: textsLive },
        ]
      : [
          { key: 'reminders.what.messages', live: textsLive && ALERT_TEXTS_LIVE },
          { key: who === 'provider' ? 'reminders.what.visits' : 'reminders.what.trips', live: textsLive && ALERT_TEXTS_LIVE },
        ];
  return [...rows].sort((a, b) => Number(!a.live) - Number(!b.live));
}
