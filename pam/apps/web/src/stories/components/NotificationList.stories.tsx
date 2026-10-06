import type { Meta, StoryObj } from '@storybook/nextjs';
import { Card } from '@astryxdesign/core/Card';
import * as stylex from '@stylexjs/stylex';
import { NotificationList, Page, type NotificationItem, type NotificationListProps } from '@pam/ui';
import { DUMMY_NOTIFICATIONS, type DummyNotification } from '@pam/config/dummy-notifications';
import { useI18n } from '@/lib/i18n';
import { whenHappened } from '@/lib/when';
import { useStoryText } from '../support/useStoryText';

/**
 * The log behind the bell (`/notifications/`). New rows are bold and carry a
 * "New" badge; a row whose subject has a screen is a link, the whole row its
 * target.
 *
 * Each row's `text` is an i18n key with its variables, and `when` an ISO time,
 * turned into "Today" / "Yesterday" / a date the way the screen does it — so
 * the Language toolbar changes every word that is Pam's own.
 */
const styles = stylex.create({ card: { width: '100%' } });

const ISO = /^\d{4}-\d{2}-\d{2}T/;

function LocalisedNotificationList({ items, labels }: NotificationListProps) {
  const tr = useStoryText();
  const { t, locale } = useI18n();
  return (
    <Card padding={3} xstyle={styles.card}>
      <NotificationList
        items={items.map((item) => ({
          ...item,
          text: tr(item.text),
          when: ISO.test(item.when) ? whenHappened(item.when, locale, t) : tr(item.when),
        }))}
        labels={{ empty: tr(labels.empty), new: tr(labels.new) }}
      />
    </Card>
  );
}

/** Where a row leads, as `hrefFor` on the notifications screen decides it. */
const HREF: Record<string, string | undefined> = {
  'notify.message_reported': '/messages/?show=reported',
  'notify.service_flagged': '/places/?filter=reported',
  'notify.message_received': '/messages/',
};

function fromDummy(rows: readonly DummyNotification[]): NotificationItem[] {
  return rows.map((row) => {
    const vars = { ...row.bodyVars };
    if (row.bodyKey === 'notify.service_flagged' && vars['reason']) {
      vars['reason'] = `flag.reason.${vars['reason']}`;
    }
    return {
      id: row.id,
      text: `${row.bodyKey}?${new URLSearchParams(vars).toString()}`,
      when: row.createdAt,
      isNew: row.isNew,
      href: HREF[row.bodyKey],
    };
  });
}

const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const meta = {
  title: 'Components/Feedback/NotificationList',
  tags: ['autodocs'],
  component: NotificationList,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedNotificationList {...args} />,
  args: {
    items: fromDummy(DUMMY_NOTIFICATIONS.member),
    labels: { empty: 'notify.none', new: 'notify.new' },
  },
} satisfies Meta<typeof NotificationList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What a member sees: points earned, and a saved place that changed. */
export const Default: Story = {};

/** A program: people interested in what they run. */
export const Program: Story = { args: { items: fromDummy(DUMMY_NOTIFICATIONS.provider) } };

/** A case manager: a place reported closed, and a reported message — both links. */
export const CaseManager: Story = { args: { items: fromDummy(DUMMY_NOTIFICATIONS.admin) } };

/** Nothing new, nothing old: one quiet sentence, not a blank card. */
export const Empty: Story = { args: { items: [] } };

/** A long week, with a long Philadelphia place name in the middle of it. */
export const LongWeek: Story = {
  args: {
    items: [
      { id: 'w1', text: 'notify.message_received?name=Teresa', when: ago(0), isNew: true, href: '/messages/' },
      {
        id: 'w2',
        text: 'notify.demo.savedPlaceUpdated?place=Free Library of Philadelphia — Joseph E. Coleman Northwest Regional Library',
        when: ago(0),
        isNew: true,
      },
      {
        id: 'w3',
        text: 'notify.service_flagged?place=Example Food Pantry&reason=flag.reason.not_accepting',
        when: ago(1),
        isNew: false,
        href: '/places/?filter=reported',
      },
      { id: 'w4', text: 'notify.demo.newInterest?count=3&program=GED classes', when: ago(2), isNew: false },
      { id: 'w5', text: 'notify.service_removed?place=Example Workforce Center', when: ago(4), isNew: false },
      { id: 'w6', text: 'notify.message_reported?name=Jordan', when: ago(6), isNew: false, href: '/messages/?show=reported' },
    ],
  },
};

export const Spanish: Story = { ...LongWeek, globals: { locale: 'es' } };
