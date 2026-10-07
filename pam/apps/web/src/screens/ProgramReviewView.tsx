'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BellOutlineIcon, BigButton, HelpIcon, LegalIcon, MeIcon, PlacesIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SetupArt } from '@pam/ui/SetupArt';
import { SubPage } from '@pam/ui/SubPage';
import { Confetti } from '@pam/ui/SuccessScreen';
import { useI18n } from '@/lib/i18n';
import { useProgramSetup, type ReviewStatus } from '@/lib/programSetup';
import { useSession } from '@/lib/useSession';
import { hasTextAlerts } from './AlertsView';

/**
 * Sent to Pam (Will, 7 October, D-379, D-380, D-381): a program a lead has
 * added, while a super admin checks it. The hero template (D-376) with its
 * own picture; confetti the moment it is sent; and the wait given a shape —
 * three steps, sent → Pam checks → live.
 *
 * D-381, from the suggestions Will took up:
 * - **Something to do while waiting** — add your photo (until there is one),
 *   your policies, a text when it's live. A lead who sets up during review
 *   is ready on day one.
 * - **"Needs changes"** — the middle step turns amber, Pam's note says what,
 *   and one button edits what was sent and sends it again.
 * - **What you sent** — read-only, one row away.
 * - **An honest wait** — after three days the page says it is taking longer
 *   (no promise of a text: that only comes with alerts on)
 *   and offers a way to ask Pam (the one help link a hero page carries,
 *   because here something may have gone wrong — sop-amendments A19).
 *
 * It is also the Program tab until the program is approved, so Back goes
 * Home, and it covers the bottom bar like any page you tap into (D-383).
 * Home shows the same status as a card (D-381).
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  body: { fontSize: '18px', lineHeight: 1.5 },
  steps: { paddingInline: '8px', paddingBlock: '12px' },
  step: { minWidth: 0, paddingBottom: '22px' },
  stepLabel: { fontSize: '17px', lineHeight: 1.45 },
  lastStep: { paddingBottom: '0px' },
  later: { color: colorVars['--color-text-secondary'] },
  // How long Pam's step takes, faint, under it (Will, D-384).
  note: { fontSize: '15px', lineHeight: 1.4, marginTop: '2px', color: colorVars['--color-text-secondary'] },
  // The marker and the line down to the next one: a progress flow (D-380).
  // The line fills the row, so it grows when a step's text wraps (D-382).
  rail: { alignItems: 'center', alignSelf: 'stretch', flexShrink: 0, width: '14px' },
  line: {
    width: '2px',
    flexGrow: 1,
    // Same 8px gap at both ends: the next marker sits 6px into its own row
    // (`mark.marginTop`), so the bottom margin is 6px less (D-382).
    marginTop: '8px',
    marginBottom: '2px',
    borderRadius: '1px',
    backgroundColor: colorVars['--color-border'],
  },
  lineDone: { backgroundColor: colorVars['--color-success'] },
  mark: {
    width: '14px',
    height: '14px',
    marginTop: '6px',
    borderRadius: '50%',
    flexShrink: 0,
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    boxSizing: 'border-box',
  },
  done: { backgroundColor: colorVars['--color-success'], borderColor: colorVars['--color-success'] },
  // The step Pam is on turns, to say it is being worked on (Will, D-384).
  working: { marginTop: '6px', flexShrink: 0, color: colorVars['--color-success'] },
  // Changes asked for: the step that is waiting on them, in amber.
  needs: { backgroundColor: colorVars['--color-warning'], borderColor: colorVars['--color-warning'] },
  // Each group of rows set apart by a hairline above it.
  group: {
    width: '100%',
    paddingTop: '16px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colorVars['--color-border'],
  },
  groupTitle: { fontSize: '15px', fontWeight: 600, color: colorVars['--color-text-secondary'] },
});

const STEPS = ['sent', 'review', 'live'] as const;

export interface ProgramReviewViewProps {
  /** Confetti: only right after sending. */
  readonly isCelebrating?: boolean;
  /** For a story; otherwise read from this account's setup. */
  readonly status?: ReviewStatus;
  /** Pam's note when it asks for changes. */
  readonly changes?: string | null;
  readonly hasPhoto?: boolean;
  /** Text alerts already on: no "Text me when it's live" row. */
  readonly hasAlerts?: boolean;
}

export function ProgramReviewView({ isCelebrating = false, ...given }: ProgramReviewViewProps = {}) {
  const { t } = useI18n();
  const { state: session } = useSession();
  const setup = useProgramSetup(session);
  const status = given.status ?? setup.reviewStatus;
  const changes = given.changes ?? setup.sent?.changes ?? null;
  const hasPhoto = given.hasPhoto ?? setup.hasPhoto;
  const [hasAlerts] = useState(() => given.hasAlerts ?? hasTextAlerts('provider'));

  // "Text me" first — the one that answers "when?" — and gone once texts
  // are on (Will, 7 October, D-386).
  const waitRows = [
    ...(hasAlerts
      ? []
      : [{ id: 'text-me', label: t('programs.review.text'), description: t('programs.review.text.body'), href: '/alerts/', icon: <BellOutlineIcon {...ICON} /> }]),
    ...(hasPhoto
      ? []
      : [{ id: 'photo', label: t('programs.review.photo'), description: t('programs.review.photo.body'), href: '/profile/', icon: <MeIcon {...ICON} /> }]),
    {
      id: 'policies',
      label: t('programs.review.policies'),
      description: t('programs.review.policies.body'),
      href: '/program/policies/',
      icon: <LegalIcon {...ICON} />,
    },
  ];

  const moreRows = [
    { id: 'sent', label: t('programs.review.seeSent'), href: '/program/sent/', icon: <PlacesIcon {...ICON} /> },
    ...(status === 'late'
      ? [{ id: 'ask', label: t('programs.review.ask'), description: t('programs.review.ask.body'), href: '/help/', icon: <HelpIcon {...ICON} /> }]
      : []),
  ];

  return (
    <SubPage
      title={t(`programs.review.title.${status}`)}
      backHref="/"
      backLabel={t('nav.back.home')}
      // Always Home: it stands in for the Program tab (D-385).
      isBackFixed
      hero={<SetupArt kind="review" isHero />}
      // It covers the bottom bar (D-383), so the one thing to do when Pam
      // asks for changes is pinned to the foot, like Next in Add a program.
      {...(status === 'changes'
        ? { footer: <BigButton label={t('programs.review.changes.edit')} href="/programs/new/?edit=1" /> }
        : {})}
    >
      {isCelebrating ? <Confetti /> : null}
      <Text xstyle={styles.body}>{t(`programs.review.body.${status}`)}</Text>

      {status === 'changes' ? (
        <Banner status="warning" title={t('programs.review.changes.title')} description={changes ?? undefined} />
      ) : null}

      <VStack gap={0} role="list" aria-label={t('programs.review.stepsLabel')} xstyle={styles.steps}>
        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          const label = step === 'review' && status === 'changes' ? t('programs.review.step.changes') : t(`programs.review.step.${step}`);
          return (
            <HStack key={step} gap={3} align="start" wrap="nowrap" role="listitem">
              <VStack aria-hidden gap={0} xstyle={styles.rail}>
                {i === 1 && status !== 'changes' ? (
                  <Spinner size="md" shade="inherit" xstyle={styles.working} />
                ) : (
                  <HStack xstyle={[styles.mark, i === 0 && styles.done, i === 1 && styles.needs]} />
                )}
                {isLast ? null : <HStack xstyle={[styles.line, i === 0 && styles.lineDone]} />}
              </VStack>
              <VStack gap={0} xstyle={[styles.step, isLast && styles.lastStep]}>
                <Text xstyle={[styles.stepLabel, isLast && styles.later]}>{label}</Text>
                {i === 1 ? <Text xstyle={styles.note}>{t(`programs.review.step.note.${status}`)}</Text> : null}
              </VStack>
            </HStack>
          );
        })}
      </VStack>

      {status === 'changes' ? null : (
        <VStack gap={2} xstyle={styles.group}>
          <Heading level={2} xstyle={styles.groupTitle}>
            {t('programs.review.meanwhile')}
          </Heading>
          <MenuList label={t('programs.review.meanwhile')} items={waitRows} />
        </VStack>
      )}

      <VStack xstyle={styles.group}>
        <MenuList label={t('programs.review.seeSent')} items={moreRows} />
      </VStack>
    </SubPage>
  );
}
