import type { Meta, StoryObj } from '@storybook/nextjs';
import { NotificationBell, Page, type NotificationBellProps } from '@pam/ui';
import { useStoryText } from '../support/useStoryText';

/**
 * The bell in the header. Quiet and outlined with nothing new; filled, with a
 * dot, when something is waiting — and the accessible name then says how many
 * ("Notifications, 2 new"), because the dot alone says nothing to a screen
 * reader.
 */
function LocalisedBell({ label, unreadLabel, unreadCount, href }: NotificationBellProps) {
  const tr = useStoryText();
  return (
    <NotificationBell
      href={href}
      label={tr(label)}
      unreadCount={unreadCount}
      unreadLabel={tr(unreadLabel ?? `notify.unread?count=${unreadCount}`)}
    />
  );
}

const meta = {
  title: 'Components/Feedback/NotificationBell',
  tags: ['autodocs'],
  component: NotificationBell,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedBell {...args} unreadLabel={`notify.unread?count=${args.unreadCount}`} />,
  args: { href: '/notifications/', label: 'notify.title', unreadCount: 0 },
  argTypes: { unreadCount: { control: { type: 'number', min: 0 } } },
} satisfies Meta<typeof NotificationBell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TwoNew: Story = { args: { unreadCount: 2 } };
export const ManyNew: Story = { args: { unreadCount: 128 } };
export const Spanish: Story = { args: { unreadCount: 2 }, globals: { locale: 'es' } };
/** The round bell in the header (D-210): drawn in line, like search beside it (D-362). */
export const Round: Story = { args: { unreadCount: 0, appearance: 'round' } };
