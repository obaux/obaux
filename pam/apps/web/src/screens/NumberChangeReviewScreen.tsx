'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { intlLocale } from '@pam/config';
import { BigButton, Loading, Notice } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { goBack } from '@/lib/navigate';
import { useSession } from '@/lib/useSession';
import {
  decideNumberChange,
  moveNumber,
  numberChangeDetail,
  type DecideFailure,
  type NumberChangeDetail,
} from '@/lib/useNumberChange';
import { HelpButton } from './HelpButton';

/**
 * One request to move an account to a new phone number, for the person who decides it (D-567): the
 * member's case manager, or the super admin. What they typed sits beside what the account says, and any
 * line that differs is marked, so a takeover has to get past a person who can see the difference.
 *
 * - A **case manager** knows the person: their Approve is the vouch.
 * - The **super admin** ticks "I spoke to this person and I'm sure it's them" first (Will's default,
 *   card a84); the tick is kept on the request and in the audit row. The new number is a tap away, to
 *   call it.
 * - A **super admin's account** is never moved: only Deny. **No account** with that number: only Deny.
 *
 * On a yes the sign-in moves (`move-number`). If that step fails the request stays approved, and "Move
 * it now" tries again.
 */
const styles = stylex.create({
  facts: { fontSize: '17px', lineHeight: 1.45 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  label: { fontSize: '14px', lineHeight: '20px', fontWeight: 600 },
  differs: { fontSize: '14px', lineHeight: '20px', fontWeight: 600, color: colorVars['--color-error'] },
  card: { width: '100%' },
  actions: { width: '100%' },
});

function when(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', day: 'numeric' }).format(new Date(iso));
}

const same = (a: string | null | undefined, b: string | null | undefined) =>
  (a ?? '').trim().toLocaleLowerCase() === (b ?? '').trim().toLocaleLowerCase();

export function NumberChangeReviewScreen({ id }: { readonly id: string | null }) {
  const { t, locale } = useI18n();
  const { state: session } = useSession();
  const isSuperAdmin = session.status === 'signed-in' && session.session.role === 'super_admin';
  const fallback = isSuperAdmin ? '/requests/' : '/';

  const [detail, setDetail] = useState<NumberChangeDetail | null | 'loading'>('loading');
  const [spoke, setSpoke] = useState(false);
  const [busy, setBusy] = useState<'approved' | 'denied' | 'moving' | null>(null);
  const [failed, setFailed] = useState<DecideFailure | null>(null);
  const [outcome, setOutcome] = useState<'moved' | 'notMoved' | 'denied' | null>(null);

  useEffect(() => {
    if (id === null || session.status === 'loading') return;
    let cancelled = false;
    void numberChangeDetail(id).then((d) => {
      if (!cancelled) setDetail(d);
    });
    return () => {
      cancelled = true;
    };
  }, [id, session.status]);

  const back = { onBack: () => goBack(fallback), backLabel: t('nav.back.requests') };

  if (detail === 'loading' || id === null) {
    return (
      <SubPage title={t('newNumber.review.title')} {...back} actions={<HelpButton />}>
        <Loading label={t('common.loading')} variant="screen" />
      </SubPage>
    );
  }

  if (detail === null) {
    return (
      <SubPage title={t('newNumber.review.title')} {...back} actions={<HelpButton />}>
        <Text xstyle={styles.facts}>{t('requests.program.gone')}</Text>
      </SubPage>
    );
  }

  const typedName = `${detail.typed.firstName} ${detail.typed.lastName}`.trim();
  const canApprove = detail.hasAccount && !detail.isProtected && detail.status === 'waiting';
  const needsTick = detail.mustSpeak;

  const move = async () => {
    setBusy('moving');
    const ok = await moveNumber(detail.id);
    setBusy(null);
    setOutcome(ok ? 'moved' : 'notMoved');
  };

  const decide = async (decision: 'approved' | 'denied') => {
    if (decision === 'approved' && needsTick && !spoke) {
      setFailed('mustSpeak');
      return;
    }
    setFailed(null);
    setBusy(decision);
    const result = await decideNumberChange(detail.id, decision, spoke);
    setBusy(null);
    if (!result.ok) {
      setFailed(result.reason);
      return;
    }
    if (decision === 'denied') setOutcome('denied');
    else await move();
  };

  // One line of the side by side: what they typed, what the account says, and whether they differ.
  const row = (label: string, typed: string, account: string | null) => (
    <VStack gap={0}>
      <Text xstyle={styles.label}>{label}</Text>
      <Text xstyle={styles.facts}>{t('newNumber.review.typed', { value: typed || '—' })}</Text>
      {detail.hasAccount ? (
        <Text xstyle={styles.facts}>{t('newNumber.review.account', { value: account || '—' })}</Text>
      ) : null}
      {detail.hasAccount && !same(typed, account) ? <Text xstyle={styles.differs}>{t('newNumber.review.differs')}</Text> : null}
    </VStack>
  );

  const done = outcome !== null && outcome !== 'notMoved';

  return (
    <SubPage
      title={typedName || t('newNumber.review.title')}
      subtitle={t('newNumber.review.subtitle')}
      {...back}
      actions={<HelpButton />}
      footer={
        <VStack gap={2} xstyle={styles.actions}>
          {done ? (
            <BigButton label={t('nav.back.requests')} onPress={() => goBack(fallback)} />
          ) : outcome === 'notMoved' ? (
            <BigButton
              label={busy === 'moving' ? t('requests.saving') : t('newNumber.review.moveAgain')}
              isDisabled={busy !== null}
              onPress={() => void move()}
            />
          ) : (
            <>
              {canApprove ? (
                <BigButton
                  label={busy === 'approved' || busy === 'moving' ? t('requests.saving') : t('requests.approve')}
                  isDisabled={busy !== null || (needsTick && !spoke)}
                  onPress={() => void decide('approved')}
                />
              ) : null}
              <BigButton
                label={busy === 'denied' ? t('requests.saving') : t('requests.deny')}
                variant={canApprove ? 'secondary' : 'primary'}
                isDisabled={busy !== null || detail.status !== 'waiting'}
                onPress={() => void decide('denied')}
              />
            </>
          )}
        </VStack>
      }
    >
      <Text type="supporting" xstyle={styles.facts}>
        {t('requests.requestedOn', { when: when(detail.createdAt, locale) ?? '' })}
      </Text>

      {detail.isProtected ? (
        <Notice notice="admin_out_of_region" title={t('newNumber.review.protected.title')} body={t('newNumber.review.protected.body')} />
      ) : !detail.hasAccount ? (
        <Notice notice="admin_out_of_region" title={t('newNumber.review.noAccount.title')} body={t('newNumber.review.noAccount.body')} />
      ) : detail.isStaff ? (
        <Text xstyle={styles.note}>{t('newNumber.review.staff')}</Text>
      ) : null}

      <Card padding={6} xstyle={styles.card}>
        <VStack gap={4}>
          {row(t('join.details.first'), detail.typed.firstName, detail.account.firstName)}
          {row(t('join.details.last'), detail.typed.lastName, detail.account.lastName)}
          {row(t('join.details.city'), detail.typed.city, detail.account.city)}
          <VStack gap={0}>
            <Text xstyle={styles.label}>{t('newNumber.who.label')}</Text>
            <Text xstyle={styles.facts}>{detail.typed.whoKnows || '—'}</Text>
            {detail.hasAccount ? (
              <Text xstyle={styles.facts}>{t('newNumber.review.invitedBy', { name: detail.account.invitedBy ?? '—' })}</Text>
            ) : null}
          </VStack>
          {detail.hasAccount ? (
            <Text xstyle={styles.facts}>
              {detail.account.lastActiveAt
                ? t('admin.lastActive', { when: when(detail.account.lastActiveAt, locale) ?? '' })
                : t('admin.lastActive.never')}
            </Text>
          ) : null}
          <VStack gap={0}>
            <Text xstyle={styles.label}>{t('newNumber.review.numbers')}</Text>
            <Text xstyle={styles.facts}>{t('newNumber.review.newNumber', { number: detail.newPhone })}</Text>
            <Text xstyle={styles.facts}>{t('newNumber.review.oldNumber', { last4: detail.oldPhoneLast4 })}</Text>
          </VStack>
        </VStack>
      </Card>

      {canApprove && needsTick && outcome === null ? (
        <CheckboxInput label={t('newNumber.review.spoke')} value={spoke} onChange={(next) => setSpoke(next)} />
      ) : null}

      {failed ? (
        <Notice notice="admin_out_of_region" title={t(`newNumber.review.failed.${failed}.title`)} body={t(`newNumber.review.failed.${failed}.body`)} />
      ) : null}
      {outcome === 'moved' ? (
        <Notice notice="admin_out_of_region" title={t('newNumber.review.moved.title')} body={t('newNumber.review.moved.body')} />
      ) : outcome === 'notMoved' ? (
        <Notice notice="something_went_wrong" title={t('newNumber.review.notMoved.title')} body={t('newNumber.review.notMoved.body')} />
      ) : outcome === 'denied' ? (
        <Notice notice="admin_out_of_region" title={t('newNumber.review.denied.title')} body={t('newNumber.review.denied.body')} />
      ) : null}
    </SubPage>
  );
}
