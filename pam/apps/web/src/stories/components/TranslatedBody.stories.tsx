import type { Meta, StoryObj } from '@storybook/nextjs';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { TranslatedBody } from '@/app/messages/TranslatedBody';

/**
 * Another person's message in the reader's language (D-414, Will's "Uber's
 * way"): the translation, then under it "Translated" and a link to what was
 * actually written. Tap the link and the original takes its place, labelled
 * "Original", with the way back. The label always says which one is on
 * screen.
 *
 * Whose language is whose is not a place — it is the reader's own choice
 * against what the message turns out to be written in. The toolbar's language
 * switch is the reader here: set it to Spanish, Russian or Arabic and the
 * label and the link follow; the words under them are the example's.
 *
 * Shown in a bubble the colour of somebody else's. A message of your own is
 * never translated for you. The feature is switched off in the app until
 * what is owed (docs/before-launch.md) is done; this is how it will look.
 */
const styles = stylex.create({
  bubble: {
    maxWidth: '280px',
    paddingInline: '16px',
    paddingBlock: '12px',
    borderRadius: '20px',
    backgroundColor: colorVars['--color-background-muted'],
  },
});

const meta = {
  title: 'Components/Cards/TranslatedBody',
  tags: ['autodocs'],
  component: TranslatedBody,
  decorators: [
    (Story) => (
      <VStack xstyle={styles.bubble}>
        <Story />
      </VStack>
    ),
  ],
  args: {
    original: 'Llego a las diez. ¿Puede darme la dirección otra vez, por favor?',
    translation: { body: 'I arrive at ten. Can you give me the address again, please?', from: 'es' },
  },
} satisfies Meta<typeof TranslatedBody>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Spanish, read in English. */
export const Translated: Story = {};

/** After tapping "Show original". */
export const ShowingOriginal: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button'));
  },
};

/**
 * The original is set in its own direction and marked with its language, so
 * an Arabic message in an English screen reads from the right and a screen
 * reader says it as Arabic.
 */
export const ArabicOriginal: Story = {
  args: {
    original: 'سأصل في العاشرة. هل يمكنك إعطائي العنوان مرة أخرى؟',
    translation: { body: 'I will arrive at ten. Can you give me the address again?', from: 'ar' },
  },
  play: ShowingOriginal.play,
};

/** A long message wraps; the label and link drop under it. */
export const Long: Story = {
  args: {
    original:
      'Buenos días. Quería preguntarle si el programa de capacitación laboral todavía tiene lugares para el próximo mes, y qué documentos necesito llevar el primer día.',
    translation: {
      body: 'Good morning. I wanted to ask if the job training program still has spots for next month, and what documents I need to bring on the first day.',
      from: 'es',
    },
  },
};

/** The service could not tell what language it was. The label says Translated all the same; the original carries no language mark. */
export const UnknownLanguage: Story = {
  args: { original: 'ok vamo q ya voy', translation: { body: 'ok let’s go, I’m coming', from: 'und' } },
};
