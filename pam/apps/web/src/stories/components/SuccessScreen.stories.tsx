import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from '@astryxdesign/core/Button';
import { SuccessScreen } from '@pam/ui/SuccessScreen';

/**
 * The "it worked" template (D-240): no bar, centred, confetti once, and a
 * quiet secondary way on. Shown here as Connect's done state.
 */
const meta = {
  title: 'Components/SuccessScreen',
  component: SuccessScreen,
  args: {
    title: 'You’re helping Marcus on their way!',
    body: 'Example Workforce Center is recommended to Marcus. They will see it on their Home and can say yes when they are ready.',
    action: <Button label="Return home" variant="secondary" href="/" />,
    note: 'An example: nothing is sent or saved yet.',
  },
} satisfies Meta<typeof SuccessScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Recommended: Story = {};
