import type { Meta, StoryObj } from '@storybook/nextjs';
import { Loading, Page, type LoadingProps } from '@pam/ui';
import { useStoryText } from '../support/useStoryText';

/**
 * Waiting. A spinner, never a sentence that might be wrong; the label is
 * announced to screen readers and never drawn.
 */
function LocalisedLoading({ label, ...rest }: LoadingProps) {
  const tr = useStoryText();
  return <Loading {...rest} label={tr(label)} />;
}

const meta = {
  title: 'Components/Feedback/Loading',
  tags: ['autodocs'],
  component: Loading,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedLoading {...args} />,
  args: { label: 'common.loading', variant: 'screen' },
  argTypes: { variant: { control: 'inline-radio', options: ['screen', 'inline'] } },
} satisfies Meta<typeof Loading>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fills the space under the header and centres in it, while a session resolves. */
export const Default: Story = {};

/** Under a header that is already drawn: a list still arriving. */
export const Inline: Story = { args: { variant: 'inline' } };
