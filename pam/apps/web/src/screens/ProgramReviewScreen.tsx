'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, Loading, Notice, TextLink } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { categoryLabelKey, intlLocale, type Category } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { goBack, navigate } from '@/lib/navigate';
import { useSession } from '@/lib/useSession';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useRoleView } from '@/lib/useViewedRole';
import {
  isLate,
  reviewProgram,
  sentFields,
  useProgramsToCheck,
  type ProgramDecision,
  type SentField,
} from '@/lib/programsToCheck';
import { ConfirmDialog } from './ConfirmDialog';
import { HelpButton } from './HelpButton';

/**
 * One program to check, on a page of its own (D-386, part 6; the page pattern
 * of `RequestReviewScreen`): who sent it and when, exactly what was sent, and
 * the decision pinned to the foot — **Approve** the one primary action and
 * **Ask for changes** beside it, which opens a note (required; the leader
 * reads it). A withdrawn request can only be **Discarded**.
 *
 * Approve applies exactly what the leader sent. The reviewer edits nothing here.
 */
const styles = stylex.create({
  facts: { fontSize: '17px', lineHeight: 1.45 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  card: { width: '100%' },
  value: { fontSize: '17px', lineHeight: 1.45, overflowWrap: 'anywhere' },
  heading: { fontSize: '15px', lineHeight: 1.3 },
  actions: { width: '100%' },
  late: { fontSize: '15px', lineHeight: 1.5, fontWeight: 600 },
});

const NOTE_MAX = 500;

export function ProgramReviewScreen({ id }: { readonly id: string | null }) {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin' && trueRole === 'super_admin';
  const { state } = useProgramsToCheck(isSuperAdmin);

  const [busy, setBusy] = useState<ProgramDecision | null>(null);
  const [failed, setFailed] = useState(false);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');
  const [needNote, setNeedNote] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const back = { onBack: () => goBack('/programs/review/'), backLabel: t('nav.back.review') };
  const program = state.status === 'ready' ? state.programs.find((p) => p.id === id) : undefined;

  if (state.status === 'loading' || session.status === 'loading' || id === null) {
    return (
      <SubPage title={t('review.title')} {...back} actions={<HelpButton />}>
        <Loading label={t('common.loading')} variant="screen" />
      </SubPage>
    );
  }
  if (!isSuperAdmin || !program) {
    return (
      <SubPage title={t('review.title')} {...back} actions={<HelpButton />}>
        <Text xstyle={styles.facts}>{t('review.gone')}</Text>
      </SubPage>
    );
  }

  const when = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso));
  const valueOf = (field: SentField, value: string): string =>
    field === 'category' ? t(categoryLabelKey(value as Category)) : field === 'subcategory' ? t(`category.sub.${value}`) : value;

  const decide = async (decision: ProgramDecision) => {
    if (decision === 'changes_asked' && note.trim() === '') {
      setNeedNote(true);
      return;
    }
    setNeedNote(false);
    setFailed(false);
    setBusy(decision);
    const ok = await reviewProgram(program.id, decision, decision === 'changes_asked' ? note.trim() : undefined);
    setBusy(null);
    if (ok) navigate('/programs/review/');
    else setFailed(true);
  };

  const footer =
    program.status === 'in_review' ? (
      asking ? (
        <VStack gap={2} xstyle={styles.actions}>
          <BigButton
            label={busy === 'changes_asked' ? t('requests.saving') : t('review.note.send')}
            isDisabled={busy !== null}
            onPress={() => void decide('changes_asked')}
          />
          <BigButton label={t('review.note.back')} variant="secondary" isDisabled={busy !== null} onPress={() => setAsking(false)} />
        </VStack>
      ) : (
        <VStack gap={2} xstyle={styles.actions}>
          <BigButton
            label={busy === 'approved' ? t('requests.saving') : t('requests.approve')}
            isDisabled={busy !== null}
            onPress={() => void decide('approved')}
          />
          <BigButton label={t('review.askChanges')} variant="secondary" isDisabled={busy !== null} onPress={() => setAsking(true)} />
        </VStack>
      )
    ) : program.status === 'withdrawn' ? (
      <VStack gap={2} xstyle={styles.actions}>
        <BigButton label={t('review.discard')} variant="secondary" isDisabled={busy !== null} onPress={() => setDiscarding(true)} />
      </VStack>
    ) : undefined;

  return (
    <SubPage
      title={program.programName}
      subtitle={t(program.kind === 'change' ? 'review.kind.change' : 'review.kind.new')}
      {...back}
      actions={<HelpButton />}
      {...(footer ? { footer } : {})}
    >
      <Text type="supporting" xstyle={styles.facts}>
        {[
          program.leadName ? t('review.by', { name: program.leadName }) : null,
          t('review.sent', { when: when(program.sentAt) }),
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>

      {isLate(program) ? (
        <Text role="status" xstyle={styles.late}>
          {t('review.days', { days: program.daysWaiting })}
        </Text>
      ) : null}

      {program.status === 'withdrawn' ? (
        <Text xstyle={styles.facts}>
          {t('review.withdrawn.line', {
            name: program.leadName ?? t('review.theLeader'),
            when: when(program.withdrawnAt ?? program.sentAt),
          })}
        </Text>
      ) : null}

      {program.status === 'changes_asked' ? <Text xstyle={styles.facts}>{t('review.status.changes')}</Text> : null}

      {program.replacesId ? (
        <TextLink label={t('review.replaces')} href={`/programs/review/item/?id=${encodeURIComponent(program.replacesId)}`} />
      ) : null}
      {program.replacedBy ? (
        <TextLink label={t('review.seeNew')} href={`/programs/review/item/?id=${encodeURIComponent(program.replacedBy)}`} />
      ) : null}

      <Card padding={6} xstyle={styles.card}>
        <VStack gap={4}>
          <Heading level={2} xstyle={styles.heading}>
            {t('review.sentTitle')}
          </Heading>
          {sentFields(program).map(({ field, value }) => (
            <VStack key={field} gap={0.5}>
              <Text type="supporting" xstyle={styles.note}>
                {t(`review.field.${field}`)}
              </Text>
              <Text xstyle={styles.value}>{valueOf(field, value)}</Text>
              {program.kind === 'change' && field === 'name' && program.programName !== value ? (
                <Text type="supporting" xstyle={styles.note}>
                  {t('review.was', { value: program.programName })}
                </Text>
              ) : null}
            </VStack>
          ))}
        </VStack>
      </Card>

      {asking ? (
        <Card padding={6} xstyle={styles.card}>
          <VStack gap={3}>
            <TextArea
              label={t('review.note.label')}
              value={note}
              onChange={(next) => setNote(next.slice(0, NOTE_MAX))}
              rows={4}
              width="100%"
              hasAutoFocus
            />
            <Text type="supporting" xstyle={styles.note}>
              {t('review.note.hint')}
            </Text>
            {needNote ? (
              <Text role="alert" type="supporting" xstyle={styles.note}>
                {t('review.note.need')}
              </Text>
            ) : null}
          </VStack>
        </Card>
      ) : null}

      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('requests.failed.title')}
          body={t('requests.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      <ConfirmDialog
        isOpen={discarding}
        title={t('review.discard.title')}
        body={t('review.discard.body')}
        confirmLabel={t('review.discard.yes')}
        onConfirm={() => {
          setDiscarding(false);
          void decide('discarded');
        }}
        cancelLabel={t('review.discard.no')}
        onCancel={() => setDiscarding(false)}
      />
    </SubPage>
  );
}
