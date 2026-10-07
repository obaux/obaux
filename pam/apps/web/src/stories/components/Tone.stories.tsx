import type { Meta, StoryObj } from '@storybook/nextjs';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { EducationIcon, FamilyServicesIcon, WorkforceIcon } from '@pam/ui';
import { ToneDot, type Tone } from '@pam/ui/Tone';

/**
 * A category's colour on Explore's chips: `ToneDot` puts a small icon on a
 * two-half circle. Only the chips (D-337): every picture of a place is the
 * category's illustration (`CategoryArt`).
 */
const TONES: readonly Tone[] = ['blue', 'green', 'purple', 'orange', 'red', 'teal', 'pink', 'cyan', 'gray'];

const SMALL = { width: 16, height: 16, 'aria-hidden': true } as const;
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
