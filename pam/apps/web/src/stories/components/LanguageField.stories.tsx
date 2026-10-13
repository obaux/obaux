import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { userEvent, within } from 'storybook/test';
import { LANGUAGE_TAGS, SUPPORTED_LOCALES } from '@pam/config';
import { LanguageField } from '@pam/ui/LanguageField';
import { useI18n } from '@/lib/i18n';

/**
 * The language to use, as a dropdown (D-561): the same box as "City you live in", each language by its own name, the English tag
 * before the name in the open list. Switch the language in the toolbar to see it in Arabic (mirrored) and the others, and
 * check it at 320px.
 */
const meta = {
  title: 'Components/Inputs/LanguageField',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function Field() {
  const { t, locale } = useI18n();
  const [value, setValue] = useState<string>(locale);
  return (
    <div style={{ width: '358px', maxWidth: '100%' }}>
      <LanguageField
        label={t('onboarding.language.title')}
        options={SUPPORTED_LOCALES.map((code) => ({ code, name: t(`language.${code}`), tag: LANGUAGE_TAGS[code] }))}
        value={value}
        onChange={setValue}
      />
    </div>
  );
}

export const Closed: Story = { render: () => <Field /> };

/** The list open: the English tag then the name in its own language, the chosen one ticked. */
export const Open: Story = {
  render: () => <Field />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox'));
  },
};
