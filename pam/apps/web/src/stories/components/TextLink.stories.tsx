import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page, TextLink, type TextLinkProps } from '@pam/ui';
import { useStoryText } from '../support/useStoryText';

/**
 * A way on that is never the main action — "See all", "Back", "Sign out".
 * Still 48px to hit.
 */
function LocalisedLink({ label, ...rest }: TextLinkProps) {
  const tr = useStoryText();
  return <TextLink {...rest} label={tr(label)} />;
}

const meta = {
  title: 'Components/Actions/TextLink',
  tags: ['autodocs'],
  component: TextLink,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedLink {...args} />,
  args: { label: 'nav.back.home', href: '/', size: 'default' },
  argTypes: {
    size: { control: 'inline-radio', options: ['default', 'quiet'] },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof TextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The small one, beside a section heading. */
export const Quiet: Story = { args: { label: 'saved.seeAll', size: 'quiet', href: '/saved/' } };

/** A button, not a link: "Send it again" under the code field on sign-in. */
export const AsAButton: Story = { args: { label: 'signin.code.resend', href: undefined } };

export const Disabled: Story = { args: { label: 'signin.code.resend', href: undefined, isDisabled: true } };

export const Spanish: Story = { args: { label: 'signin.phone.label', href: undefined }, globals: { locale: 'es' } };
