import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page, PointsBadge, type PointsBadgeProps } from '@pam/ui';
import { useStoryText } from '../support/useStoryText';

/**
 * The points counter. Counts up when the value rises — the count-up is the
 * reward — except under `prefers-reduced-motion`, where the number simply
 * changes. Change the `points` control to see it.
 */
function LocalisedPoints({ label, ...rest }: PointsBadgeProps) {
  const tr = useStoryText();
  return <PointsBadge {...rest} label={tr(label)} />;
}

const meta = {
  title: 'Components/PointsBadge',
  component: PointsBadge,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedPoints {...args} />,
  args: { points: 25, label: 'points.title' },
  argTypes: { points: { control: { type: 'number', min: 0, step: 25 } } },
} satisfies Meta<typeof PointsBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first points, at the end of sign-up. */
export const JustJoined: Story = {};
export const NoPointsYet: Story = { args: { points: 0 } };

/** A thousands separator, in the locale's own form. */
export const ALotOfPoints: Story = { args: { points: 12450 } };

export const Spanish: Story = { ...ALotOfPoints, globals: { locale: 'es' } };
