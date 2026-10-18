import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from '@astryxdesign/core/Button';
import { SuccessScreen } from '@pam/ui/SuccessScreen';
import { useStoryText } from '../support/useStoryText';

/** Connect's done state, in the app's own words (read from the bundle, so they follow the Language toolbar). */
function ConnectDone() {
  const tr = useStoryText();
  return (
    <SuccessScreen
      title={tr('person.connect.done.title?name=Marcus')}
      body={tr('person.connect.done.body?name=Marcus')}
      action={<Button label={tr('person.connect.done.home')} variant="secondary" href="/" />}
      note={tr('person.connect.example')}
    />
  );
}

/**
 * The "it worked" template (D-240): no bar, centred, confetti once, and a
 * quiet secondary way on. Shown here as Connect's done state.
 */
const meta = {
  title: 'Components/Feedback/SuccessScreen',
  tags: ['autodocs'],
  component: SuccessScreen,
  // Drawn from the bundle by `ConnectDone`; the args are only what Controls shows.
  args: { title: 'person.connect.done.title', body: 'person.connect.done.body', action: null },
  render: () => <ConnectDone />,
} satisfies Meta<typeof SuccessScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
