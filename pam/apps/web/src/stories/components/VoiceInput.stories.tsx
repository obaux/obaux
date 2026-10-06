import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { Page, VoiceInput, type SpeechRecognizer, type VoiceInputProps } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { useStoryText } from '../support/useStoryText';

/**
 * A text field with a microphone beside it, for somebody who would rather say
 * it than type it. The mic only appears when the device can actually listen —
 * a dead button is worse than none — so each story passes a stand-in
 * recognizer rather than relying on the browser's own.
 */
function LocalisedVoice({ label, description, micLabels, value, onChange, ...rest }: VoiceInputProps) {
  const tr = useStoryText();
  const { locale } = useI18n();
  const [current, setCurrent] = useState(value);
  return (
    <VoiceInput
      {...rest}
      label={tr(label)}
      {...(description ? { description: tr(description) } : {})}
      language={locale === 'es' ? 'es-US' : 'en-US'}
      value={current}
      onChange={(next) => {
        setCurrent(next);
        onChange(next);
      }}
      micLabels={{ start: tr(micLabels.start), listening: tr(micLabels.listening) }}
    />
  );
}

/** Hears "1231 N Broad St" a second and a half after the mic is tapped. */
const hears: SpeechRecognizer = {
  isAvailable: () => true,
  start: () => new Promise((resolve) => setTimeout(() => resolve('1231 N Broad St'), 1500)),
};

/** Listens for ever, so the listening state can be looked at. */
const keepsListening: SpeechRecognizer = {
  isAvailable: () => true,
  start: () => new Promise<string>(() => {}),
};

/** A device with no speech recognition: no mic at all. */
const cannotListen: SpeechRecognizer = { isAvailable: () => false, start: async () => '' };

const meta = {
  title: 'Components/Inputs/VoiceInput',
  tags: ['autodocs'],
  component: VoiceInput,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedVoice {...args} />,
  args: {
    label: 'places.areaLabel',
    description: 'places.areaHint',
    value: '',
    onChange: fn(),
    micLabels: { start: 'voice.start', listening: 'voice.listening' },
    recognizer: hears,
  },
  argTypes: { recognizer: { control: false }, type: { control: 'inline-radio', options: ['text', 'email'] } },
} satisfies Meta<typeof VoiceInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tap the mic: it fills in an address after a moment. */
export const Default: Story = {};

export const Listening: Story = {
  args: { recognizer: keepsListening },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button'));
  },
};

export const Filled: Story = { args: { value: '1231 N Broad St' } };

export const NoMicAvailable: Story = { args: { recognizer: cannotListen } };

export const Required: Story = {
  args: { label: 'join.details.first', description: undefined, isRequired: true },
};

export const Spanish: Story = { ...Listening, globals: { locale: 'es' } };
