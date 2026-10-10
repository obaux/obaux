'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Card } from '@astryxdesign/core/Card';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, Loading, Notice, Page } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { assignGuide, handOver, useGuideChoices } from '@/lib/useGuides';
import { ConfirmDialog } from './ConfirmDialog';
import { HeaderActions } from './HeaderActions';

/**
 * Choosing a member's guide (D-446), in two places:
 *
 * - **`handover`** — a case manager, from one of their own members' page,
 *   gives them to another case manager in their city. Nothing is chosen when
 *   the screen opens. Afterwards they no longer see the member, so the way
 *   on is Home, not the member's page.
 * - **`assign`** — the super admin, from Everyone, sets any member's guide,
 *   or leaves them with none ("No guide"). The current guide is chosen when
 *   the screen opens, so Save does nothing until something changes. The
 *   super admin is in the list too: assigning someone to themselves is how
 *   the Pam team becomes the guide who may limit them (D-446).
 *
 * Who is listed, and who may do it, is the database's call
 * (`guides_i_can_choose`, `hand_over_member`, `assign_guide`). An example
 * person is listed with the example case managers, and nothing is written.
 */
const NONE = 'none';

const styles = stylex.create({
  intro: { fontSize: '17px', lineHeight: 1.45 },
  card: { width: '100%' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  // Room between the choices, and words a size up from the defaults: the
  // description is what the choice means for the member (D-446).
  options: { rowGap: spacingVars['--spacing-3'] },
  option: { fontSize: '17px', lineHeight: 1.35 },
  optionBody: { fontSize: '15px', lineHeight: 1.4 },
  // A name with nothing under it is a short row; without this two of them sit
  // 32px apart and their 48px targets overlap (measured in Storybook, D-446).
  optionAlone: { display: 'flex', alignItems: 'center', minHeight: '48px' },
});

export interface ChooseGuideViewProps {
  readonly mode: 'handover' | 'assign';
  readonly personId: string;
  readonly name: string;
  readonly isExample: boolean;
  /** The member's guide now, for `assign`; `null` when they have none. */
  readonly currentGuideId?: string | null;
  readonly backHref: string;
  readonly backLabel: string;
}

export function ChooseGuideView({
  mode,
  personId,
  name,
  isExample,
  currentGuideId = null,
  backHref,
  backLabel,
}: ChooseGuideViewProps) {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const choices = useGuideChoices(true, isExample);
  const initial = mode === 'assign' ? (currentGuideId ?? NONE) : '';
  const [selected, setSelected] = useState<string>(initial);
  const [asking, setAsking] = useState(false);
  const [state, setState] = useState<'idle' | 'saving' | 'failed' | 'done'>('idle');

  const guides = choices.status === 'ready' ? choices.guides : [];
  const guideName = (id: string) => guides.find((g) => g.id === id)?.firstName ?? '—';
  const chosenNone = selected === NONE;

  const header = (
    <SubPageHeader
      title={t(mode === 'handover' ? 'handover.title' : 'assignGuide.title', { name })}
      backHref={backHref}
      backLabel={backLabel}
      actions={<HeaderActions role={mode === 'handover' ? 'admin' : 'super_admin'} />}
    />
  );

  if (state === 'done') {
    return (
      <Page gap={4}>
        {header}
        <Notice
          notice="service_not_available"
          title={
            chosenNone
              ? t('assignGuide.done.none', { name })
              : t('assignGuide.done.title', { name, guide: guideName(selected) })
          }
          body={t(mode === 'handover' ? 'handover.done.body' : 'assignGuide.done.body', { name })}
        />
        {isExample ? (
          <Text type="supporting" xstyle={styles.note}>
            {t('access.example')}
          </Text>
        ) : null}
        {mode === 'handover' ? (
          <BigButton label={t('nav.back.home')} href="/" />
        ) : (
          <BigButton label={backLabel} href={backHref} />
        )}
      </Page>
    );
  }

  const save = async () => {
    setAsking(false);
    if (isExample) {
      setState('done');
      return;
    }
    setState('saving');
    const ok =
      mode === 'handover'
        ? await handOver(personId, selected)
        : await assignGuide(personId, chosenNone ? null : selected);
    setState(ok ? 'done' : 'failed');
  };

  const canSave = selected !== '' && selected !== initial && state !== 'saving';

  return (
    <Page gap={4}>
      {header}

      <Text type="supporting" xstyle={styles.intro}>
        {t(mode === 'handover' ? 'handover.intro' : 'assignGuide.intro', { name })}
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

      {choices.status === 'loading' ? <Loading label={t('common.loading')} /> : null}

      {choices.status === 'error' ? (
        <Notice
          notice="something_went_wrong"
          title={t('access.failed.title')}
          body={t('access.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {choices.status === 'ready' && mode === 'handover' && guides.length === 0 ? (
        <Notice
          notice="service_not_available"
          title={t('handover.none.title')}
          body={t('handover.none.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {choices.status === 'ready' && (mode === 'assign' || guides.length > 0) ? (
        <Card padding={6} xstyle={styles.card}>
          <VStack gap={4}>
            <RadioList
              label={t(mode === 'handover' ? 'handover.choose' : 'assignGuide.choose')}
              value={selected}
              onChange={(next) => setSelected(next)}
              xstyle={styles.options}
            >
              {guides.map((guide) => (
                <RadioListItem
                  key={guide.id}
                  value={guide.id}
                  label={
                    <Text xstyle={[styles.option, !(mode === 'assign' && guide.regionName) && styles.optionAlone]}>
                      {guide.firstName ?? '—'}
                    </Text>
                  }
                  aria-label={guide.firstName ?? '—'}
                  {...(mode === 'assign' && guide.regionName
                    ? { description: <Text type="supporting" xstyle={styles.optionBody}>{guide.regionName}</Text> }
                    : {})}
                />
              ))}
              {mode === 'assign' ? (
                <RadioListItem
                  value={NONE}
                  label={<Text xstyle={styles.option}>{t('assignGuide.none')}</Text>}
                  aria-label={t('assignGuide.none')}
                  description={<Text type="supporting" xstyle={styles.optionBody}>{t('assignGuide.none.body')}</Text>}
                />
              ) : null}
            </RadioList>
            <BigButton
              label={state === 'saving' ? t('access.saving') : t(mode === 'handover' ? 'handover.action' : 'access.save')}
              onPress={() => setAsking(true)}
              isDisabled={!canSave}
            />
          </VStack>
        </Card>
      ) : null}

      <ConfirmDialog
        isOpen={asking}
        title={
          chosenNone
            ? t('assignGuide.confirm.none.title', { name })
            : t(mode === 'handover' ? 'handover.confirm.title' : 'assignGuide.confirm.title', {
                name,
                guide: guideName(selected),
              })
        }
        body={
          chosenNone
            ? t('assignGuide.confirm.none.body', { name })
            : t(mode === 'handover' ? 'handover.confirm.body' : 'assignGuide.confirm.body', {
                name,
                guide: guideName(selected),
              })
        }
        confirmLabel={t(mode === 'handover' ? 'handover.action' : 'access.save')}
        onConfirm={() => void save()}
        cancelLabel={t('access.confirm.cancel')}
        onCancel={() => setAsking(false)}
      />
    </Page>
  );
}
