import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page } from '@pam/ui';
import { ChoiceChips } from '@pam/ui/ChoiceChips';

/**
 * One choice from a few, as pills (D-359, D-366): the chosen one in the
 * secondary green, the rest white with a grey edge. Each is a 48px button with
 * `aria-pressed`; the group carries the question.
 *
 * An option may carry a `tag` and the `lang` its label is written in (D-449):
 * the tag is a short English name before the words ("EN", "PT-BR"), hidden from
 * a screen reader; `lang` makes the label speak in its own voice.
 */
function Chips({ options, initial }: { readonly options: React.ComponentProps<typeof ChoiceChips<string>>['options']; readonly initial: string }) {
  const [value, setValue] = useState<string | null>(initial);
  return <ChoiceChips label="Language" options={options} value={value} onChange={setValue} />;
}

const meta = {
  title: 'Components/Inputs/ChoiceChips',
  tags: ['autodocs'],
  component: Chips,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
} satisfies Meta<typeof Chips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initial: 'morning',
    options: [
      { value: 'morning', label: 'Morning' },
      { value: 'afternoon', label: 'Afternoon' },
      { value: 'evening', label: 'Evening' },
    ],
  },
};

const LANGUAGES = [
  { value: 'en', tag: 'EN', lang: 'en', label: 'English' },
  { value: 'es', tag: 'ES', lang: 'es', label: 'Español' },
  { value: 'pt-BR', tag: 'PT-BR', lang: 'pt-BR', label: 'Português' },
  { value: 'zh-CN', tag: 'ZH-CN', lang: 'zh-CN', label: '简体中文' },
  { value: 'zh-HK', tag: 'ZH-HK', lang: 'zh-HK', label: '繁體中文' },
  { value: 'ru', tag: 'RU', lang: 'ru', label: 'Русский' },
  { value: 'ar', tag: 'AR', lang: 'ar', label: 'العربية' },
];

/** Sign-up's language choice with a tag before each name. */
export const WithLanguageTags: Story = { args: { initial: 'ru', options: LANGUAGES } };

/** Right to left: the tag is still at the start of each chip, still left to right. */
export const WithLanguageTagsArabic: Story = { ...WithLanguageTags, globals: { locale: 'ar' } };
