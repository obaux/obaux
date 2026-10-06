'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';
import type { DummyService } from '@pam/config/dummy-services';
import { BigButton, TextField, TextLink } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/navigate';
import { usePolicies } from '@/lib/usePolicies';
import { useServices } from '@/lib/useServices';
import { ConfirmDialog } from './ConfirmDialog';
import { HelpButton } from './HelpButton';

/**
 * A program lead adds or edits one service (D-313): its name, what it is,
 * and — only where they differ from the program's — a phone number and a
 * website, then which policies are only for this service. Saved for the
 * session (`useServices`); members see it on the program's page at once.
 *
 * Removing asks first: a service coming off is the one thing here that
 * loses something. Visits already booked for it stay booked.
 */
const PROGRAM_PLACE_ID = 'dummy-place-learning';

const styles = stylex.create({
  intro: { fontSize: '17px', lineHeight: 1.5 },
  field: { width: '100%' },
  heading: { fontSize: '18px', lineHeight: 1.3 },
  hint: { fontSize: '15px', lineHeight: 1.5 },
  choices: { rowGap: '12px' },
  need: { fontSize: '15px', lineHeight: 1.5 },
});

const DESCRIPTION_MAX = 240;

export function ServiceEditView({ serviceId }: { readonly serviceId: string | null }) {
  const { t } = useI18n();
  const { services, save, remove } = useServices();
  const { policies } = usePolicies();
  const existing = serviceId ? (services.find((s) => s.id === serviceId) ?? null) : null;
  const [draft, setDraft] = useState<DummyService>(
    existing ?? {
      id: `service-added-${Date.now()}`,
      placeId: PROGRAM_PLACE_ID,
      name: '',
      description: '',
      phone: null,
      website: null,
      policyIds: [],
    },
  );
  const [tried, setTried] = useState(false);
  const [asking, setAsking] = useState(false);
  const set = (patch: Partial<DummyService>) => setDraft((d) => ({ ...d, ...patch }));
  const invalid = tried && draft.name.trim() === '';

  const submit = () => {
    setTried(true);
    if (draft.name.trim() === '') return;
    save({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      phone: draft.phone?.trim() || null,
      website: draft.website?.trim() || null,
    });
    navigate('/program/');
  };

  return (
    <SubPage
      title={existing ? t('program.service.title') : t('program.service.new')}
      subtitle={existing?.name}
      backHref="/program/"
      backLabel={t('program.service.back')}
      actions={<HelpButton />}
    >
      <Text type="supporting" xstyle={styles.intro}>
        {t('program.service.intro')}
      </Text>

      <Card padding={6}>
        <VStack gap={3}>
          <TextField
            label={t('program.service.name')}
            value={draft.name}
            onChange={(next) => set({ name: next })}
            width="100%"
            xstyle={styles.field}
          />
          <TextArea
            label={t('program.service.description')}
            value={draft.description}
            onChange={(next) => set({ description: next.slice(0, DESCRIPTION_MAX) })}
            rows={3}
            width="100%"
          />
          <TextField
            purpose="phone"
            label={t('program.service.phone')}
            value={draft.phone ?? ''}
            onChange={(next) => set({ phone: next })}
            width="100%"
            xstyle={styles.field}
          />
          <TextField
            label={t('program.service.website')}
            value={draft.website ?? ''}
            onChange={(next) => set({ website: next })}
            width="100%"
            xstyle={styles.field}
          />
          {invalid ? (
            <Text type="supporting" xstyle={styles.need}>
              {t('program.service.need.name')}
            </Text>
          ) : null}
        </VStack>
      </Card>

      {/* Which policies are only for this service (D-313). */}
      <Card padding={6}>
        <VStack gap={3}>
          <Heading level={2} xstyle={styles.heading}>
            {t('program.service.policies')}
          </Heading>
          <Text type="supporting" xstyle={styles.hint}>
            {policies.length === 0 ? t('program.service.policies.none') : t('program.service.policies.hint')}
          </Text>
          {policies.length > 0 ? (
            <VStack gap={2} xstyle={styles.choices}>
              {policies.map((policy) => (
                <CheckboxInput
                  key={policy.id}
                  label={policy.title}
                  value={draft.policyIds.includes(policy.id)}
                  onChange={(on) =>
                    set({
                      policyIds: on
                        ? [...draft.policyIds.filter((id) => id !== policy.id), policy.id]
                        : draft.policyIds.filter((id) => id !== policy.id),
                    })
                  }
                />
              ))}
            </VStack>
          ) : null}
        </VStack>
      </Card>

      <BigButton label={t('program.service.save')} onPress={submit} />

      {existing ? (
        <TextLink label={t('program.service.remove')} onClick={() => setAsking(true)} />
      ) : null}

      <ConfirmDialog
        isOpen={asking}
        title={t('program.service.remove.title', { name: existing?.name ?? '' })}
        body={t('program.service.remove.body')}
        confirmLabel={t('program.service.remove.yes')}
        onConfirm={() => {
          if (existing) remove(existing.id);
          setAsking(false);
          navigate('/program/');
        }}
        cancelLabel={t('program.service.remove.no')}
        onCancel={() => setAsking(false)}
      />
    </SubPage>
  );
}
