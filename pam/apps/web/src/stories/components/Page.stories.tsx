import type { Meta, StoryObj } from '@storybook/nextjs';
import { Text } from '@astryxdesign/core/Text';
import { BigButton, HelpBar, Page, PageTitle, type PageProps } from '@pam/ui';
import { useStoryText } from '../support/useStoryText';

/**
 * The shape every screen has: one column, the same gutter and width
 * everywhere, and the arrival fade (none under reduced motion). `read` widens
 * the column for long prose; `center` is for a screen that is one thought.
 *
 * The children here are a typical screen — a title, a line, the one primary
 * action and the way to help — so the frame is judged with something in it.
 */
function Screen(args: Omit<PageProps, 'children'>) {
  const tr = useStoryText();
  return (
    <Page {...args}>
      <PageTitle title={tr('help.title')} backHref="/" backLabel={tr('nav.back.home')} />
      <Text>{tr('help.intro')}</Text>
      <Text type="supporting">{tr('help.call.body')}</Text>
      <BigButton label={tr('help.call.action')} href="tel:+12673095265" />
      <HelpBar label={tr('nav.help')} variant="block" />
    </Page>
  );
}

const meta = {
  title: 'Components/Page',
  component: Page,
  render: (args) => <Screen width={args.width} align={args.align} gap={args.gap} />,
  args: { children: null, width: 'app', align: 'start', gap: 4 },
  argTypes: {
    width: { control: 'inline-radio', options: ['app', 'read'] },
    align: { control: 'inline-radio', options: ['start', 'center'] },
    gap: { control: 'inline-radio', options: [0, 1, 2, 3, 4] },
    children: { control: false },
  },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const App: Story = {};

/** Wider, for legal text — try it at the Desktop viewport. */
export const Read: Story = { args: { width: 'read' }, globals: { viewport: { value: 'desktop', isRotated: false } } };

/** Centred, as sign-in is. */
export const Centred: Story = { args: { align: 'center' } };

export const Tight: Story = { args: { gap: 2 } };

export const Spanish: Story = { globals: { locale: 'es' } };
