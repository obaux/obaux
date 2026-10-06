import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { EducationIcon, FamilyServicesIcon, WorkforceIcon } from '@pam/ui';
import { ToneBakedIcon, ToneDot, ToneGround, ToneIcon, type Tone } from '@pam/ui/Tone';

/**
 * A category's colour in the illustrations' flat, hard-edged style: `ToneDot`
 * puts a small icon on a two-half circle (the category chips), `ToneGround`
 * fills a square picture edge to edge with two darker shards (Saved, trip
 * cards, the next visit), and `ToneIcon` / `ToneBakedIcon` give the icon the
 * tone's deep shade. Use it wherever a place's category needs its colour.
 */
const TONES: readonly Tone[] = ['blue', 'green', 'purple', 'orange', 'red', 'teal', 'pink', 'cyan', 'gray'];

const SMALL = { width: 16, height: 16, 'aria-hidden': true } as const;
const LARGE = { width: 44, height: 44, 'aria-hidden': true } as const;

const styles = stylex.create({
  square: {
    width: '96px',
    height: '96px',
    flexShrink: 0,
    borderRadius: '14px',
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
  },
});

function Square({ tone, children }: { readonly tone: Tone; readonly children: React.ReactNode }) {
  return (
    <HStack align="center" justify="center" xstyle={styles.square}>
      <ToneGround tone={tone} />
      {children}
    </HStack>
  );
}

const meta = {
  title: 'Components/Illustration/Tone',
  tags: ['autodocs'],
  component: ToneDot,
  args: { tone: 'blue', children: <EducationIcon {...SMALL} /> },
  argTypes: {
    tone: { control: 'select', options: [...TONES, null] },
    children: { control: false },
  },
} satisfies Meta<typeof ToneDot>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A chip's icon on its tone: School and training, in blue. */
export const Default: Story = {};

/** Work and money, in green. */
export const Green: Story = { args: { tone: 'green', children: <WorkforceIcon {...SMALL} /> } };

/** Every tone as a dot, to compare them side by side. */
export const AllDots: Story = {
  render: () => (
    <HStack gap={3} wrap="wrap">
      {TONES.map((tone) => (
        <VStack key={tone} gap={1} align="center">
          <ToneDot tone={tone}>
            <FamilyServicesIcon {...SMALL} />
          </ToneDot>
          <Text type="supporting">{tone}</Text>
        </VStack>
      ))}
    </HStack>
  ),
};

/** The ground behind a square picture, with the icon pressed into it (trip cards). */
export const Ground: Story = {
  render: (args) => {
    const tone = args.tone ?? 'blue';
    return (
      <HStack gap={4} wrap="wrap">
        <Square tone={tone}>
          <ToneBakedIcon tone={tone}>
            <EducationIcon {...LARGE} />
          </ToneBakedIcon>
        </Square>
        <Square tone={tone}>
          <ToneIcon tone={tone}>
            <EducationIcon {...LARGE} />
          </ToneIcon>
        </Square>
      </HStack>
    );
  },
};

/** Every tone as a ground, each with its baked icon. */
export const AllGrounds: Story = {
  render: () => (
    <HStack gap={3} wrap="wrap">
      {TONES.map((tone) => (
        <VStack key={tone} gap={1} align="center">
          <Square tone={tone}>
            <ToneBakedIcon tone={tone}>
              <WorkforceIcon {...LARGE} />
            </ToneBakedIcon>
          </Square>
          <Text type="supporting">{tone}</Text>
        </VStack>
      ))}
    </HStack>
  ),
};
