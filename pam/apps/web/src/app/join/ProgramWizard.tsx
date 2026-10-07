'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, TextField, TextLink } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { CATEGORY_LIST, subcategoriesFor, type Category } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import type { ProgramDetails } from '@/lib/useJoin';

/**
 * A program, one question at a time (D-347, Will, 7 October: "proceed with
 * staff onboarding, simplify using industry standards"; #78, "one thing per
 * screen").
 *
 * It was one long form — name, two lists of choices, a description, address,
 * phone, website and services — on a phone, under a sentence saying most of
 * it was optional. The way sign-ups that people actually finish do it
 * (Stripe's, Airbnb's, Shopify's): one plain question per screen, how far
 * along you are, only what is needed asked as needed, everything else
 * skippable, and a last screen that shows every answer with a way to change
 * it before anything is sent.
 *
 *   1. What's it called?          — the one thing required
 *   2. What kind of help?         — three choices, one already picked
 *   3. What does it focus on?     — skip
 *   4. Tell people about it       — skip
 *   5. Where is it?               — skip
 *   6. How do people reach you?   — phone and website together, skip
 *   7. What does it offer?        — services, skip
 *   8. Check your program         — every answer, each a row that goes back
 *
 * The step is the parent's (`step`, `onStep`), so the screen's Back goes one
 * question back rather than out of the program, and its title stays put.
 * The fields are the same `ProgramDetails` as before (0056, D-313): only how
 * they are asked changed.
 */
export const PROGRAM_STEPS = ['name', 'kind', 'focus', 'about', 'where', 'contact', 'services', 'review'] as const;
export type ProgramStep = (typeof PROGRAM_STEPS)[number];

export interface ProgramWizardProps {
  readonly value: ProgramDetails;
  readonly onChange: (next: ProgramDetails) => void;
  /** From the review screen: send it. */
  readonly onSubmit: () => void;
  readonly busy: boolean;
  /** The review screen's button — "Next" at sign-up, "Send to Pam" on Add a program. */
  readonly submitLabel?: string;
  /** Which question, 0–7. */
  readonly step: number;
  readonly onStep: (step: number) => void;
}

const DESCRIPTION_MAX = 200;

const styles = stylex.create({
  card: { width: '100%' },
  question: { fontSize: '24px', lineHeight: 1.25, fontWeight: 700 },
  hint: { fontSize: '16px', lineHeight: 1.5 },
  field: { textAlign: 'start' },
  choices: { rowGap: '12px' },
  serviceRow: { width: '100%' },
  serviceField: { flexGrow: 1, minWidth: 0, textAlign: 'start' },
  removeService: { width: '48px', height: '48px', flexShrink: 0 },
  actions: { width: '100%', alignItems: 'center' },
});

/**
 * The wizard in two parts (D-357): the question, and its buttons — so a page
 * can pin the buttons to its footer (`SubPage footer`) while the question
 * scrolls. `ProgramWizard` is both, stacked.
 */
export function ProgramWizard(props: ProgramWizardProps) {
  const { body, actions } = useProgramWizard(props);
  return (
    <VStack gap={4} xstyle={styles.card}>
      {body}
      {actions}
    </VStack>
  );
}

export function useProgramWizard({ value, onChange, onSubmit, busy, submitLabel, step, onStep }: ProgramWizardProps) {
  const { t } = useI18n();
  // Next is always tappable (D-334): without a name it says what is missing.
  const [triedName, setTriedName] = useState(false);
  const category = (value.category || 'education') as Category;
  const set = (patch: Partial<ProgramDetails>) => onChange({ ...value, ...patch });
  const at = PROGRAM_STEPS[Math.min(Math.max(step, 0), PROGRAM_STEPS.length - 1)]!;
  const questions = PROGRAM_STEPS.length - 1;
  const next = () => onStep(step + 1);
  const needsName = value.name.trim() === '';
  const categoryLabel = CATEGORY_LIST.find((c) => c.key === category);
  const focusLabel = subcategoriesFor(category).find((s) => s.key === value.subcategory);
  const filled = value.services.map((s) => s.trim()).filter(Boolean);

  // Skippable questions say so beside Next; the first two are not optional
  // (a name) or already answered (a kind is picked for you).
  const skippable = at !== 'name' && at !== 'kind' && at !== 'review';

  // How far along, in the Next button's corner now (D-357), not over the question.
  const progress = t('join.program.progress', { current: step + 1, total: questions });

  const body = (
    <VStack gap={4} xstyle={styles.card}>
      <Heading level={2} xstyle={styles.question}>
        {t(`join.program.step.${at}`)}
      </Heading>

      {at === 'name' ? (
        <VStack gap={2}>
          <TextField
            purpose="name"
            label={t('join.program.name')}
            // The question above is the label people read; this one is heard.
            isLabelHidden
            value={value.name}
            onChange={(next) => set({ name: next })}
            width="100%"
            xstyle={styles.field}
          />
          <Text type="supporting" xstyle={styles.hint}>
            {t('join.program.step.name.hint')}
          </Text>
          {triedName && needsName ? <Banner status="warning" title={t('join.program.need.name')} /> : null}
        </VStack>
      ) : null}

      {at === 'kind' ? (
        <RadioList
          label={t('join.program.category')}
          isLabelHidden
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
      ) : null}

      {at === 'focus' ? (
        <RadioList
          label={t('join.program.subcategory')}
          isLabelHidden
          value={value.subcategory}
          onChange={(next) => set({ subcategory: String(next) })}
          xstyle={styles.choices}
        >
          {subcategoriesFor(category).map((sub) => (
            <RadioListItem key={sub.key} value={sub.key} label={t(sub.labelKey)} />
          ))}
        </RadioList>
      ) : null}

      {at === 'about' ? (
        <TextArea
          label={t('join.program.description')}
          value={value.description}
          onChange={(next) => set({ description: next.slice(0, DESCRIPTION_MAX) })}
          rows={3}
          width="100%"
        />
      ) : null}

      {at === 'where' ? (
        <TextField
          purpose="address"
          label={t('join.program.address')}
          value={value.address}
          onChange={(next) => set({ address: next })}
          width="100%"
          xstyle={styles.field}
        />
      ) : null}

      {at === 'contact' ? (
        <VStack gap={3}>
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
        </VStack>
      ) : null}

      {at === 'services' ? (
        <VStack gap={2}>
          <Text type="supporting" xstyle={styles.hint}>
            {t('join.program.services.hint')}
          </Text>
          {(value.services.length === 0 ? [''] : value.services).map((name, i) => (
            <HStack key={i} gap={2} align="end" wrap="nowrap" xstyle={styles.serviceRow}>
              <TextField
                label={t('join.program.service', { n: i + 1 })}
                value={name}
                onChange={(next) => {
                  const list = value.services.length === 0 ? [''] : value.services;
                  set({ services: list.map((s, j) => (j === i ? next : s)) });
                }}
                width="100%"
                xstyle={styles.serviceField}
              />
              {value.services.length > 1 ? (
                <IconButton
                  label={t('join.program.services.remove', { n: i + 1 })}
                  icon={<Icon icon="close" size="md" />}
                  variant="ghost"
                  onClick={() => set({ services: value.services.filter((_, j) => j !== i) })}
                  xstyle={styles.removeService}
                />
              ) : null}
            </HStack>
          ))}
          <TextLink
            label={t('join.program.services.add')}
            onClick={() => set({ services: [...(value.services.length === 0 ? [''] : value.services), ''] })}
          />
        </VStack>
      ) : null}

      {at === 'review' ? (
        // Every answer, each a row back to its question (the review step
        // every checkout has). Unanswered ones say so, rather than vanish.
        <MenuList
          label={t('join.program.step.review')}
          hasDividers
          items={[
            { id: 'name', label: t('join.program.name'), value: value.name.trim() },
            { id: 'kind', label: t('join.program.category'), value: categoryLabel ? t(categoryLabel.labelKey) : '' },
            { id: 'focus', label: t('join.program.subcategory'), value: focusLabel ? t(focusLabel.labelKey) : '' },
            { id: 'about', label: t('join.program.review.about'), value: value.description.trim() },
            { id: 'where', label: t('join.program.address'), value: value.address.trim() },
            {
              id: 'contact',
              label: t('join.program.review.contact'),
              value: [value.phone.trim(), value.website.trim()].filter(Boolean).join(' · '),
            },
            { id: 'services', label: t('join.program.services'), value: filled.join(', ') },
          ].map((row) => ({
            id: row.id,
            label: row.label,
            description: row.value || t('join.program.review.empty'),
            icon: null,
            onSelect: () => onStep(PROGRAM_STEPS.indexOf(row.id as ProgramStep)),
          }))}
        />
      ) : null}

    </VStack>
  );

  const actions = (
      <VStack gap={1} xstyle={styles.actions}>
        {at === 'review' ? (
          <BigButton
            label={busy ? t('join.saving') : (submitLabel ?? t('action.next'))}
            onPress={() => {
              if (needsName) {
                setTriedName(true);
                onStep(0);
              } else onSubmit();
            }}
            isDisabled={busy}
          />
        ) : (
          <BigButton
            label={t('action.next')}
            badge={progress}
            onPress={() => {
              if (at === 'name' && needsName) setTriedName(true);
              else next();
            }}
          />
        )}
        {skippable ? <TextLink label={t('join.program.skip')} onClick={next} /> : null}
      </VStack>
  );

  return { body, actions };
}
