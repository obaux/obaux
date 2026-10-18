import { ALERT_TEXTS_LIVE } from './alertTextsLive';
import { VISIT_REMINDERS_LIVE_IN_APP } from './visitRemindersLive';

/** Which kinds of texts the consent screens list for a kind of person, and whether each is sent today (D-608). See `TextKindsList`. */
export type TextKindsFor = 'member' | 'admin' | 'provider';

interface Kind {
  readonly key: string;
  readonly live: boolean;
}

/** The rows for one kind of person, whether each is sent today, and in the order they are shown. */
export function textKindsFor(who: TextKindsFor, textsLive: boolean): readonly Kind[] {
  // The same names as Text alerts (Sage, 18 October, signed 11175802 and 9f550846): one vocabulary for the kinds of texts.
  const alerts = textsLive && ALERT_TEXTS_LIVE;
  const rows: Kind[] =
    who === 'member'
      ? [
          { key: 'alerts.visit', live: textsLive && VISIT_REMINDERS_LIVE_IN_APP },
          { key: 'alerts.closed', live: textsLive },
        ]
      : who === 'provider'
        ? [
            { key: 'alerts.booked', live: alerts },
            { key: 'alerts.changed', live: alerts },
            { key: 'alerts.message', live: alerts },
          ]
        : [
            { key: 'alerts.message', live: alerts },
            { key: 'alerts.trip', live: alerts },
          ];
  return [...rows].sort((a, b) => Number(!a.live) - Number(!b.live));
}
