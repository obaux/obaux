'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@pam/ui/Button';
import { Loading, Notice, PlaceCard } from '@pam/ui';
import { NOTICES, type Category } from '@pam/config';
import { examplesOn } from '@/lib/examples';
import { DUMMY_FLAGS } from '@pam/config/dummy-places';
import { useI18n } from '@/lib/i18n';
import { placeStatus } from '@/lib/usePlaceStatus';
import { ConfirmDialog } from '../../screens/ConfirmDialog';
import { resolveFlag, type FlaggedPlace, type FlaggedPlacesState } from '@/lib/useFlaggedPlaces';

/**
 * The Reported places screen (D-189; it was a filter on the old `/places/` list, retired 13 October 2026): places somebody said are closed,
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
  // What was reported, at reading size (Iris's super admin pass, W4): it was a 12px badge.
  reason: { fontSize: '17px', lineHeight: 1.4, fontWeight: 600 },
  wrote: { fontSize: '16px', lineHeight: 1.45 },
  hint: { fontSize: '15px', lineHeight: 1.45 },
});

interface Row {
  readonly id: string;
  readonly flagId: string;
  readonly name: string;
  readonly category: Category;
  readonly description: string | null;
  readonly reason: FlaggedPlace['reason'];
  /** What the reporter typed, if they did: a member's own words, shown as data. */
  readonly note: string | null;
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
}: {
  readonly state: FlaggedPlacesState;
  readonly previewing: boolean;
  readonly canResolve: boolean;
  readonly useDummy: boolean;
  readonly onResolved: () => void;
  readonly now: Date | null;
}) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [decidedDummies, setDecidedDummies] = useState<readonly string[]>([]);
  // Taking a place off the list asks first; every decision says what was done afterwards (Iris's super admin pass, W1).
  const [confirming, setConfirming] = useState<Row | null>(null);
  const [done, setDone] = useState<{ readonly key: 'keep' | 'remove'; readonly place: string } | null>(null);

  // Example reports for a demo or Storybook only: a real super admin with nothing reported sees none (D-509).
  const showDummy = useDummy && examplesOn() && (previewing || state.status === 'empty');

  const rows: readonly Row[] = showDummy
    ? DUMMY_FLAGS.filter((f) => !decidedDummies.includes(f.id)).map((f) => ({
        id: f.place.id,
        flagId: f.id,
        name: f.place.name,
        category: f.place.category,
        description: f.place.description,
        reason: f.reason,
        note: f.note,
        count: f.count,
        hours: null,
        href: `/place/?id=${encodeURIComponent(f.place.id)}&from=reported`,
      }))
    : state.status === 'ready'
      ? state.places.map((p) => ({
          id: p.id,
          flagId: p.flagId,
          name: p.name,
          category: p.category,
          description: p.description,
          reason: p.reason,
          note: p.note,
          count: p.flagCount,
          hours: p.hours,
          href: `/place/?id=${encodeURIComponent(p.id)}&from=reported`,
        }))
      : [];

  const decide = async (row: Row, action: 'keep' | 'remove') => {
    if (busy) return;
    setFailed(false);
    setDone(null);
    if (showDummy) {
      setDecidedDummies((prev) => [...prev, row.flagId]);
      setDone({ key: action, place: row.name });
      return;
    }
    setBusy(row.flagId);
    const ok = await resolveFlag(row.flagId, action);
    setBusy(null);
    if (!ok) {
      setFailed(true);
      return;
    }
    setDone({ key: action, place: row.name });
    onResolved();
  };

  return (
    <VStack gap={3}>
      {done ? (
        <Banner status="success" title={t(`places.reported.done.${done.key}`, { place: done.place })} />
      ) : null}

      {!showDummy && state.status === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

      {!showDummy && state.status === 'error' ? (
        <Notice
          notice={state.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          contactLabel={t('help.contact.action')}
        />
      ) : null}

      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('places.reported.failed.title')}
          body={t('places.reported.failed.body')}
          contactLabel={t('help.contact.action')}
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
            category={row.category}
            artSeed={row.id}
            href={row.href}
            description={row.description}
            status={placeStatus(row.id, row.hours, now, t, locale)}
            flagActions={
              <VStack gap={2}>
                <Text xstyle={styles.reason}>{label}</Text>
                {row.note ? (
                  <Text xstyle={styles.wrote}>
                    {t('places.reported.wrote')} <q dir="auto">{row.note}</q>
                  </Text>
                ) : null}
                {canResolve ? (
                  <>
                    <Text type="supporting" xstyle={styles.hint}>
                      {t('places.reported.keep.hint')}
                    </Text>
                    <Button
                      label={t('places.reported.keep')}
                      variant="secondary"
                      isDisabled={busy !== null}
                      onClick={() => void decide(row, 'keep')}
                      xstyle={styles.action}
                    />
                    <Text type="supporting" xstyle={styles.hint}>
                      {t('places.reported.remove.hint')}
                    </Text>
                    <Button
                      label={t('places.reported.remove')}
                      variant="secondary"
                      isDisabled={busy !== null}
                      onClick={() => setConfirming(row)}
                      xstyle={styles.action}
                    />
                  </>
                ) : null}
              </VStack>
            }
            labels={{ save: t('action.save'), saved: t('places.saved') }}
          />
        );
      })}

      <ConfirmDialog
        isOpen={confirming !== null}
        title={t('places.reported.remove.confirm.title', { place: confirming?.name ?? '' })}
        body={t('places.reported.remove.confirm.body')}
        confirmLabel={t('places.reported.remove')}
        onConfirm={() => {
          const row = confirming;
          setConfirming(null);
          if (row) void decide(row, 'remove');
        }}
        cancelLabel={t('program.cancel')}
        onCancel={() => setConfirming(null)}
      />

      {showDummy && rows.length > 0 ? (
        <Text type="supporting" xstyle={styles.note}>
          {t('example.people.note')}
        </Text>
      ) : null}
    </VStack>
  );
}
