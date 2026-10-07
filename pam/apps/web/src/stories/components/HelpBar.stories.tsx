import type { Meta, StoryObj } from '@storybook/nextjs';
import { HelpBar, Page, type HelpBarProps } from '@pam/ui';
import { useStoryText } from '../support/useStoryText';

/**
 * The persistent way out of a stuck screen (§0). Compact in the bottom bar,
 * beside the tabs; full width at the foot of a screen with room to spare. It
 * goes to `/help/` rather than dialling, so that screen can say when somebody
 * answers.
 */
function LocalisedHelp({ label, ...rest }: HelpBarProps) {
  const tr = useStoryText();
  return <HelpBar {...rest} label={tr(label)} />;
}

const meta = {
  title: 'Components/Navigation/HelpBar',
  tags: ['autodocs'],
  component: HelpBar,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedHelp {...args} />,
  args: { label: 'nav.help', href: '/help/', variant: 'compact' },
  argTypes: { variant: { control: 'inline-radio', options: ['compact', 'block'] } },
} satisfies Meta<typeof HelpBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** At the foot of a screen, as `/place/` and the error screens use it. */
export const Block: Story = { args: { variant: 'block' } };

/** The longer label some screens use. */
export const BlockLongLabel: Story = { args: { variant: 'block', label: 'help.needHelp' } };

export const Spanish: Story = { ...BlockLongLabel, globals: { locale: 'es' } };
