'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@pam/ui/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { SegmentedControl } from '@astryxdesign/core/SegmentedControl';
import { Segment } from '@pam/ui/Segment';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BookIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { PolicyUploadCard } from '@pam/ui/PolicyUploadCard';
import { SubPage } from '@pam/ui/SubPage';
import type { DummyPolicy } from '@pam/config/dummy-policies';
import { useI18n } from '@/lib/i18n';
import { usePolicies } from '@/lib/usePolicies';
import { servicesForPolicy } from '@pam/config/dummy-services';
import { useServices } from '@/lib/useServices';
import { ConfirmDialog } from './ConfirmDialog';
import { intlLocale } from '@pam/config';

/**
 * Policies for participants (Will, 4 October, D-261): the documents a
 * program asks people to read and sign — a confidentiality and disclosure
 * policy, a liability disclaimer, a photo release — laid out like Legal.
 *
 * - **Add** at the top: a PDF, or a photo of each page — one dashed card
 *   with a PDF icon and a Choose files button, or a file dropped on it (D-348).
 * - **The list**, each with how many have signed; a row opens the policy.
 * - **Edit**, top right, puts a remove button on each row; removing asks
 *   first (a policy coming off is the one thing here that loses something).
 *
 * A policy opens on two tabs: **Preview** (its words) and **Signed** (who
 * has, and when). Example data only for now (`usePolicies`).
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  heading: { fontSize: '20px', lineHeight: 1.3 },
  edit: {
    minHeight: '48px',
    paddingInline: '20px',
    fontSize: '17px',
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  row: { width: '100%' },
  rowWords: { flexGrow: 1, minWidth: 0 },
  rowTitle: { fontSize: '17px', fontWeight: 600, lineHeight: 1.35 },
  rowMeta: { fontSize: '15px', lineHeight: 1.4 },
  remove: { width: '48px', height: '48px', minHeight: '48px', flexShrink: 0 },
  pills: { borderRadius: '999px', alignSelf: 'flex-start' },
  body: { fontSize: '18px', lineHeight: 1.6 },
  name: { fontSize: '17px', fontWeight: 600 },
  when: { fontSize: '15px' },
  empty: { fontSize: '17px' },
});

export function PoliciesScreen() {
  const { t, tPlain } = useI18n();
  const { policies, add, remove } = usePolicies();
  const { forPlace } = useServices();
  const [isEditing, setIsEditing] = useState(false);
  const [asking, setAsking] = useState<DummyPolicy | null>(null);
  // Which services ask for it (D-313): named by none means everyone signs it.
  const services = forPlace('dummy-place-learning');
  const forWhom = (policy: DummyPolicy) => {
    const only = servicesForPolicy(policy.id, services);
    return services.length === 0
      ? null
      : only.length === 0
        ? t('policies.forAll')
        : t('policies.forServices', { services: only.map((s) => s.name).join(', ') });
  };

  return (
    <SubPage
      title={t('policies.title')}
      backHref="/program/"
      backLabel={t('nav.back.program')}
      actions={
        policies.length > 0 ? (
          <Button
            label={t(isEditing ? 'saved.done' : 'saved.edit')}
            variant="ghost"
            onClick={() => setIsEditing((on) => !on)}
            xstyle={styles.edit}
          />
        ) : undefined
      }
    >
      <Text type="supporting" xstyle={styles.intro}>
        {t('policies.intro')}
      </Text>

      {/* New ones first, at the top (Will); a full card with a PDF (D-348). */}
      <PolicyUploadCard
        title={t('policies.upload.label')}
        hint={t('policies.upload.hint')}
        buttonLabel={t('policies.upload.button')}
        onFiles={add}
      />

      <Text xstyle={styles.heading}>{t('policies.list')}</Text>
      {policies.length === 0 ? (
        <Text type="supporting" xstyle={styles.empty}>
          {t('policies.empty')}
        </Text>
      ) : isEditing ? (
        // Edit: each row with its own remove button, and no way in.
        <VStack gap={1}>
          {policies.map((policy) => (
            <HStack key={policy.id} gap={3} align="center" wrap="nowrap" xstyle={styles.row}>
              <BookIcon {...ICON} />
              <VStack gap={0} xstyle={styles.rowWords}>
                <Text xstyle={styles.rowTitle}>{policy.title}</Text>
                <Text type="supporting" xstyle={styles.rowMeta}>
                  {[t('policies.signedCount', { count: policy.signedBy.length }), forWhom(policy)].filter(Boolean).join(' · ')}
                </Text>
              </VStack>
              <IconButton
                label={tPlain('policies.remove', { title: policy.title })}
                variant="ghost"
                icon={<Icon icon="close" size="md" />}
                onClick={() => setAsking(policy)}
                xstyle={styles.remove}
              />
            </HStack>
          ))}
        </VStack>
      ) : (
        <MenuList
          label={t('policies.list')}
          hasDividers
          items={policies.map((policy) => ({
            id: policy.id,
            label: policy.title,
            description: [t('policies.signedCount', { count: policy.signedBy.length }), forWhom(policy)].filter(Boolean).join(' · '),
            href: `/program/policies/view/?id=${encodeURIComponent(policy.id)}`,
            icon: <BookIcon {...ICON} />,
          }))}
        />
      )}

      <ConfirmDialog
        isOpen={asking !== null}
        title={t('policies.remove.title', { title: asking?.title ?? '' })}
        body={t('policies.remove.body')}
        confirmLabel={t('policies.remove.yes')}
        onConfirm={() => {
          if (asking) remove([asking.id]);
          setAsking(null);
        }}
        cancelLabel={t('policies.remove.no')}
        onCancel={() => setAsking(null)}
      />
    </SubPage>
  );
}

export function PolicyScreen({ id }: { readonly id: string | null }) {
  const { t, locale } = useI18n();
  const { policies } = usePolicies();
  const [tab, setTab] = useState<'preview' | 'signed'>('preview');
  const policy = policies.find((p) => p.id === id) ?? null;
  const day = new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', day: 'numeric' });

  return (
    <SubPage
      title={policy?.title ?? t('policies.title')}
      backHref="/program/policies/"
      backLabel={t('nav.back.policies')}
    >
      {policy ? (
        <>
          {/* Preview or Signed, at the top of the page (Will). */}
          <SegmentedControl
            label={t('policy.tabs')}
            value={tab}
            onChange={(next) => setTab(next as 'preview' | 'signed')}
            size="md"
            xstyle={styles.pills}
          >
            <Segment value="preview" label={t('policy.tab.preview')} />
            <Segment value="signed" label={`${t('policy.tab.signed')} · ${policy.signedBy.length}`} />
          </SegmentedControl>

          {tab === 'preview' ? (
            <Card padding={6}>
              <VStack gap={3}>
                {policy.body.length > 0 ? (
                  policy.body.map((para, i) => (
                    <Text key={i} xstyle={styles.body}>
                      {para}
                    </Text>
                  ))
                ) : (
                  <Text type="supporting" xstyle={styles.body}>
                    {t('policy.preview.file', { file: policy.fileName })}
                  </Text>
                )}
              </VStack>
            </Card>
          ) : policy.signedBy.length === 0 ? (
            <Text type="supporting" xstyle={styles.empty}>
              {t('policy.signed.none')}
            </Text>
          ) : (
            <VStack gap={2}>
              {policy.signedBy.map((s) => (
                <HStack key={s.personId} gap={3} align="center" wrap="nowrap" xstyle={styles.row}>
                  <Avatar size="md" name={s.firstName} tooltip={false} alt="" />
                  <VStack gap={0} xstyle={styles.rowWords}>
                    <Text xstyle={styles.name}>{s.firstName}</Text>
                    <Text type="supporting" xstyle={styles.when}>
                      {t('policy.signed.on', { date: day.format(new Date(s.signedAt)) })}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          )}
        </>
      ) : (
        <Text type="supporting" xstyle={styles.empty}>
          {t('policies.empty')}
        </Text>
      )}
    </SubPage>
  );
}
