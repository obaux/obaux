'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Loading, Notice, PlaceCard } from '@pam/ui';
import { NOTICES } from '@pam/config';
import { DUMMY_FLAGS } from '@pam/config/dummy-places';
import { useI18n } from '@/lib/i18n';
import { placeStatus } from '@/lib/usePlaceStatus';
import { resolveFlag, type FlaggedPlace, type FlaggedPlacesState } from '@/lib/useFlaggedPlaces';

/**
 * The Reported filter on `/places/` (D-189): places somebody said are closed,
 * moved, full or wrong, for the people who review them. The same `PlaceCard`
 * as the rest of the list, with the reason on it and — for a super admin —
 * the two decisions `resolve_service_flag()` (0036) offers: keep it, or take
 * it off the list (which tells whoever saved it, by text). A case manager
 * sees the list and cannot decide; the function would refuse them, so the
 * buttons are not drawn.
 *
 * A preview, or a real reviewer with nothing reported, sees the example
 * flags — the same two places and reasons the example bell rows name. The
 * example decisions only take the card off this screen.
 */

const styles = stylex.create({
  note: { fontSize: '15px', lineHeight: 1.5 },
  action: { minHeight: '48px', fontSize: '16px' },
});

interface Row {
  readonly id: string;
  readonly flagId: string;
  readonly name: string;
  readonly description: string | null;
  readonly reason: FlaggedPlace['reason'];
  readonly count: number;
  readonly hours: unknown;
  readonly href: string;
}

export function ReportedPlaces({
  state,
  previewing,
  canResolve,
  useDummy,
  onResolved,
  now,
  supportPhone,
}: {
  readonly state: FlaggedPlacesState;
  readonly previewing: boolean;
  readonly canResolve: boolean;
  readonly useDummy: boolean;
  readonly onResolved: () => void;
  readonly now: Date | null;
  readonly supportPhone: string;
}) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [decidedDummies, setDecidedDummies] = useState<readonly string[]>([]);

  const showDummy = useDummy && (previewing || state.status === 'empty');

  const rows: readonly Row[] = showDummy
    ? DUMMY_FLAGS.filter((f) => !decidedDummies.includes(f.id)).map((f) => ({
        id: f.place.id,
        flagId: f.id,
        name: f.place.name,
        description: f.place.description,
        reason: f.reason,
        count: f.count,
        hours: null,
        href: `/place/?id=${encodeURIComponent(f.place.id)}&from=places`,
      }))
    : state.status === 'ready'
      ? state.places.map((p) => ({
          id: p.id,
          flagId: p.flagId,
          name: p.name,
          description: p.description,
          reason: p.reason,
          count: p.flagCount,
          hours: p.hours,
          href: `/place/?id=${encodeURIComponent(p.id)}&from=places`,
        }))
      : [];

  const decide = async (row: Row, action: 'keep' | 'remove') => {
    if (busy) return;
    setFailed(false);
    if (showDummy) {
      setDecidedDummies((prev) => [...prev, row.flagId]);
      return;
    }
    setBusy(row.flagId);
    const ok = await resolveFlag(row.flagId, action);
    setBusy(null);
    if (!ok) {
      setFailed(true);
      return;
    }
    onResolved();
  };

  return (
    <VStack gap={3}>
      {!showDummy && state.status === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

      {!showDummy && state.status === 'error' ? (
        <Notice
          notice={state.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('places.reported.failed.title')}
          body={t('places.reported.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {(!showDummy && state.status === 'empty') || (showDummy && rows.length === 0) ? (
        <Notice
          notice="no_places_found"
          title={t('places.reported.empty.title')}
          body={t('places.reported.empty.body')}
        />
      ) : null}

      {rows.map((row) => {
        const reason = t(`flag.reason.${row.reason}`);
        const label = row.count > 1 ? `${reason} · ${t('places.reported.count', { count: row.count })}` : reason;
        return (
          <PlaceCard
            key={row.flagId}
            name={row.name}
            href={row.href}
            description={row.description}
            status={placeStatus(row.id, row.hours, now, t, locale)}
            flagLabel={label}
            flagActions={
              canResolve || showDummy ? (
                <>
                  <Button
                    label={t('places.reported.keep')}
                    variant="secondary"
                    isDisabled={busy !== null}
                    onClick={() => void decide(row, 'keep')}
                    xstyle={styles.action}
                  />
                  <Button
                    label={t('places.reported.remove')}
                    variant="secondary"
                    isDisabled={busy !== null}
                    onClick={() => void decide(row, 'remove')}
                    xstyle={styles.action}
                  />
                </>
              ) : undefined
            }
            labels={{ save: t('action.save'), saved: t('places.saved') }}
          />
        );
      })}

      {showDummy && rows.length > 0 ? (
        <Text type="supporting" xstyle={styles.note}>
          {t('example.people.note')}
        </Text>
      ) : null}
    </VStack>
  );
}
