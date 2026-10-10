'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Card } from '@astryxdesign/core/Card';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, Notice, Page } from '@pam/ui';
import { PersonDetailSkeleton } from '@pam/ui/Skeletons';
import { SubPageHeader } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { setAccessStatus, useCaseloadPerson, type AccessStatus } from '@/lib/useGuides';
import { ConfirmDialog } from './ConfirmDialog';
import { HeaderActions } from './HeaderActions';

/**
 * Limit or pause a member, or turn them back on (D-446) — from the member's
 * page, for the case manager they are assigned to.
 *
 * Three choices, one reason, one button. The reason is required, as the
 * database requires it and the privacy policy promises ("They have to write
 * down why"); only staff read it. The dialog says what the member will meet:
 * a limited member sees the notice built in D-427 on Messages and where the
 * composer was; a paused one cannot sign in. Nothing new is promised here.
 *
 * Anyone but the member's own case manager is refused by the database
 * (`admin_set_access_status` → `admin_covers`), not by this screen. For a
 * person from the example cast nothing is written, and the screen says so.
 */
const CHOICES: readonly AccessStatus[] = ['active', 'limited', 'suspended'];

const styles = stylex.create({
  intro: { fontSize: '17px', lineHeight: 1.45 },
  card: { width: '100%' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  // Room between the choices, and words a size up from the defaults: the
  // description is what the choice means for the member (D-446).
  options: { rowGap: spacingVars['--spacing-3'] },
  option: { fontSize: '17px', lineHeight: 1.35 },
  optionBody: { fontSize: '15px', lineHeight: 1.4 },
});

export function ManageAccessView({ personId }: { readonly personId: string }) {
  const { t, tPlain } = useI18n();
  const supportPhone = useSupportPhone();
  const { loading, person } = useCaseloadPerson(personId);
  const [choice, setChoice] = useState<AccessStatus | null>(null);
  const [reason, setReason] = useState('');
  const [asking, setAsking] = useState(false);
  const [state, setState] = useState<'idle' | 'saving' | 'failed' | AccessStatus>('idle');

  const back = `/person/?id=${encodeURIComponent(personId)}`;
  const name = person?.firstName ?? '';
  const header = (
    <SubPageHeader
      title={person ? t('access.title', { name }) : t('person.title')}
      backHref={back}
      backLabel={person ? tPlain('access.back', { name }) : t('nav.back.home')}
      actions={<HeaderActions role="admin" />}
    />
  );

  if (loading) {
    return (
      <Page gap={4}>
        {header}
        <PersonDetailSkeleton label={t('common.loading')} />
      </Page>
    );
  }

  if (!person) {
    return (
      <Page gap={4}>
        {header}
        <Notice
          notice="service_not_available"
          title={t('person.notFound.title')}
          body={t('person.notFound.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <BigButton label={t('nav.back.home')} href="/" />
      </Page>
    );
  }

  if (state === 'active' || state === 'limited' || state === 'suspended') {
    return (
      <Page gap={4}>
        {header}
        <Notice
          notice="service_not_available"
          title={t(`access.done.title.${state}`, { name })}
          body={t('access.done.body')}
        />
        {person.isExample ? (
          <Text type="supporting" xstyle={styles.note}>
            {t('access.example')}
          </Text>
        ) : null}
        <BigButton label={t('access.back', { name })} href={back} />
      </Page>
    );
  }

  const current = person.accessStatus;
  const selected = choice ?? current;
  const canSave = selected !== current && reason.trim().length > 0 && state !== 'saving';

  const save = async () => {
    setAsking(false);
    if (person.isExample) {
      setState(selected);
      return;
    }
    setState('saving');
    const ok = await setAccessStatus(personId, selected, reason);
    setState(ok ? selected : 'failed');
  };

  return (
    <Page gap={4}>
      {header}

      <Text type="supporting" xstyle={styles.intro}>
        {t('access.intro', { name })}
      </Text>

      {state === 'failed' ? (
        <Notice
          notice="something_went_wrong"
          title={t('access.failed.title')}
          body={t('access.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      <Card padding={6} xstyle={styles.card}>
        <VStack gap={4}>
          <RadioList
            label={t('access.choice.label', { name })}
            value={selected}
            onChange={(next) => setChoice(next as AccessStatus)}
            xstyle={styles.options}
          >
            {CHOICES.map((option) => (
              <RadioListItem
                key={option}
                value={option}
                label={<Text xstyle={styles.option}>{t(`access.choice.${option}`)}</Text>}
                aria-label={t(`access.choice.${option}`)}
                description={<Text type="supporting" xstyle={styles.optionBody}>{t(`access.choice.${option}.body`, { name })}</Text>}
              />
            ))}
          </RadioList>
          <TextArea
            label={t('access.reason.label')}
            description={t('access.reason.hint')}
            value={reason}
            onChange={(next) => setReason(next)}
            rows={3}
            width="100%"
          />
          <BigButton
            label={state === 'saving' ? t('access.saving') : t('access.save')}
            onPress={() => setAsking(true)}
            isDisabled={!canSave}
          />
        </VStack>
      </Card>

      <ConfirmDialog
        isOpen={asking}
        title={t(`access.confirm.title.${selected}`, { name })}
        body={t(`access.confirm.body.${selected}`, { name })}
        confirmLabel={t(`access.confirm.action.${selected}`)}
        onConfirm={() => void save()}
        cancelLabel={t('access.confirm.cancel')}
        onCancel={() => setAsking(false)}
      />
    </Page>
  );
}
