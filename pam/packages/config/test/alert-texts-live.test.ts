import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The four Text alerts switches work only once the texts may be sent (D-478, the merge desk's hold of
 * 10 October 2026): not before Will says go and the carrier registration is approved.
 * `apps/web/src/lib/alertTextsLive.ts` holds the switch. It is flipped in the same change as the
 * visit reminders (`VISIT_REMINDERS_LIVE`, `apps/site/src/content/flags.ts`, once that file exists on
 * `main`), so this fails if the alerts are live while the reminders are not.
 */
const read = (relative: string) => {
  try {
    return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');
  } catch {
    return '';
  }
};
const flagIn = (source: string, name: string) => new RegExp(`export const ${name} = (true|false);`).exec(source)?.[1];

describe('the Text alerts switches are held until the day (D-478)', () => {
  const alerts = flagIn(read('../../../apps/web/src/lib/alertTextsLive.ts'), 'ALERT_TEXTS_LIVE');

  it('the flag exists', () => {
    expect(alerts, 'ALERT_TEXTS_LIVE not found in apps/web/src/lib/alertTextsLive.ts').toBeDefined();
  });

  it('is not on while the visit reminders are not live', () => {
    const reminders = flagIn(read('../../../apps/site/src/content/flags.ts'), 'VISIT_REMINDERS_LIVE');
    // No flag yet (the file is not on this branch) counts as not live.
    if (alerts === 'true') {
      expect(
        reminders,
        'ALERT_TEXTS_LIVE is true but VISIT_REMINDERS_LIVE is not: texts go live together (docs/sms-setup.md, "The day")',
      ).toBe('true');
    }
  });

  it('while it is off, no switch can be turned on and the screen writes nothing', () => {
    const view = read('../../../apps/web/src/screens/AlertsView.tsx');
    // The four kinds are in the live set only through the flag.
    expect(view).toMatch(/ALERT_TEXTS_LIVE \? \[[^\]]*'message'[^\]]*\] : \['closed'\]/);
    // And a change returns before it writes anything for a kind that is not live.
    expect(view).toMatch(/if \(!LIVE\.has\(kind\) \|\| !userId \|\| stopped\) return;/);
  });
});
