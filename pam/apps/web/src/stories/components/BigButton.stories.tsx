import type { Meta, StoryObj } from '@storybook/nextjs';
import { BigButton, Page } from '@pam/ui';

/** The one primary action on a screen (§2.5): 64px tall, full width, a verb. */
const meta = {
  title: 'Components/Actions/BigButton',
  tags: ['autodocs'],
  component: BigButton,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  args: { label: 'Find a place near me', variant: 'primary' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
    onPress: { action: 'pressed' },
  },
} satisfies Meta<typeof BigButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: 'secondary', label: 'Not now' } };
export const Loading: Story = { args: { isLoading: true } };
export const Disabled: Story = { args: { isDisabled: true } };
export const AsALink: Story = { args: { label: 'Call Pam', href: 'tel:+12673095265' } };

/** A step count tucked into the left end (D-357): a darker green pill, white text. */
export const WithStepBadge: Story = { args: { label: 'Next', badge: '2 of 7' } };
