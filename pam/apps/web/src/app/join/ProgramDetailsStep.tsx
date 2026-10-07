'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { BigButton, TextField, TextLink } from '@pam/ui';
import { CATEGORY_LIST, subcategoriesFor, type Category } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import type { ProgramDetails } from '@/lib/useJoin';

/**
 * What a program lead already knows about their own program, asked once, at
 * sign-up, instead of by phone after they are approved (0056).
 *
 * **Manual entry only.** Will asked for an option to pull these from a
 * Google Maps link too — that needs an Edge Function that does not exist yet
 * (the Google Places key is provisioned but unused, per `STATUS.md`), so this
 * ships as the front end only, typed by hand. The field set mirrors
 * `services` (0003) exactly, so nothing here needs to change shape once the
 * Maps option is built — it would fill these same fields rather than add new
 * ones.
 *
 * Only the name is required. A super admin reviews every submission before
 * it reaches the real catalogue (0056's `review_staff_request`), the same
 * `needs_review` gate every other manually-entered place already goes
 * through — an incomplete program is easier to finish there than to block
 * somebody's sign-up over.
 */
export interface ProgramDetailsStepProps {
  readonly value: ProgramDetails;
  readonly onChange: (next: ProgramDetails) => void;
  readonly onSubmit: () => void;
  readonly busy: boolean;
  readonly invalid: boolean;
  /** The button's words — "Next" at sign-up, "Send to Pam" on Add a program (D-218). */
  readonly submitLabel?: string;
}

const styles = stylex.create({
  card: { width: '100%' },
  field: { textAlign: 'start' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  choices: { rowGap: '12px' },
  serviceRow: { width: '100%' },
  serviceField: { flexGrow: 1, minWidth: 0, textAlign: 'start' },
  removeService: { width: '48px', height: '48px', flexShrink: 0 },
});

const DESCRIPTION_MAX = 200;

export function ProgramDetailsStep({ value, onChange, onSubmit, busy, invalid, submitLabel }: ProgramDetailsStepProps) {
  const { t } = useI18n();
  const category = (value.category || 'education') as Category;
  const set = (patch: Partial<ProgramDetails>) => onChange({ ...value, ...patch });

  return (
    <VStack gap={3} xstyle={styles.card}>
      <Text type="supporting" xstyle={styles.note}>
        {t('join.program.intro')}
      </Text>

      <TextField
        purpose="name"
        label={t('join.program.name')}
        value={value.name}
        onChange={(next) => set({ name: next })}
        width="100%"
        xstyle={styles.field}
      />

      <RadioList
        label={t('join.program.category')}
        value={category}
        onChange={(next) => {
          const nextCategory = next as Category;
          const stillValid = subcategoriesFor(nextCategory).some((s) => s.key === value.subcategory);
          set({ category: nextCategory, subcategory: stillValid ? value.subcategory : '' });
        }}
        xstyle={styles.choices}
      >
        {CATEGORY_LIST.map((def) => (
          <RadioListItem key={def.key} value={def.key} label={t(def.labelKey)} />
        ))}
      </RadioList>

      <RadioList
        label={t('join.program.subcategory')}
        value={value.subcategory}
        onChange={(next) => set({ subcategory: String(next) })}
        xstyle={styles.choices}
      >
        {subcategoriesFor(category).map((sub) => (
          <RadioListItem key={sub.key} value={sub.key} label={t(sub.labelKey)} />
        ))}
      </RadioList>

      <TextArea
        label={t('join.program.description')}
        value={value.description}
        onChange={(next) => set({ description: next.slice(0, DESCRIPTION_MAX) })}
        rows={2}
        width="100%"
      />

      <TextField
        purpose="address"
        label={t('join.program.address')}
        value={value.address}
        onChange={(next) => set({ address: next })}
        width="100%"
        xstyle={styles.field}
      />

      <TextField
        purpose="phone"
        label={t('join.program.phone')}
        value={value.phone}
        onChange={(next) => set({ phone: next })}
        width="100%"
        xstyle={styles.field}
      />

      <TextField
        label={t('join.program.website')}
        value={value.website}
        onChange={(next) => set({ website: next })}
        width="100%"
        xstyle={styles.field}
      />

      {/*
        What the program offers, by name (D-313): one field each, as many as
        they do. Phone, website and policies per service come later, from
        the Program tab, so sign-up stays short.
      */}
      <VStack gap={2}>
        <Text xstyle={styles.field}>{t('join.program.services')}</Text>
        <Text type="supporting" xstyle={[styles.note, styles.field]}>
          {t('join.program.services.hint')}
        </Text>
        {value.services.map((name, i) => (
          <HStack key={i} gap={2} align="end" wrap="nowrap" xstyle={styles.serviceRow}>
            <TextField
              label={t('join.program.service', { n: i + 1 })}
              value={name}
              onChange={(next) => set({ services: value.services.map((s, j) => (j === i ? next : s)) })}
              width="100%"
              xstyle={styles.serviceField}
            />
            <IconButton
              label={t('join.program.services.remove', { n: i + 1 })}
              icon={<Icon icon="close" size="md" />}
              variant="ghost"
              onClick={() => set({ services: value.services.filter((_, j) => j !== i) })}
              xstyle={styles.removeService}
            />
          </HStack>
        ))}
        <TextLink
          label={value.services.length === 0 ? t('program.services.add') : t('join.program.services.add')}
          onClick={() => set({ services: [...value.services, ''] })}
        />
      </VStack>

      {invalid ? (
        <Text type="supporting" xstyle={styles.note}>
          {t('join.program.need.name')}
        </Text>
      ) : null}

      <BigButton label={busy ? t('join.saving') : (submitLabel ?? t('action.next'))} onPress={onSubmit} isDisabled={busy} />
    </VStack>
  );
}
