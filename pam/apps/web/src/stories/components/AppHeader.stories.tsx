import type { Meta, StoryObj } from '@storybook/nextjs';
import { AppHeader, NotificationBell, Page, type AppHeaderProps } from '@pam/ui';
import { RoleSwitch } from '@pam/ui/RoleSwitch';
import { ROLES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useStoryText } from '../support/useStoryText';

/**
 * The top of every screen: the mark (a real link home), who you are signed in
 * as, and — once there is a role — the bell and your account on the right.
 * Signed out, it is the mark alone.
 */
function LocalisedHeader({ roleLabel, accountLabel, ...rest }: AppHeaderProps) {
  const tr = useStoryText();
  return (
    <AppHeader
      {...rest}
      roleLabel={tr(roleLabel)}
      accountLabel={tr(accountLabel ?? 'account.open')}
    />
  );
}

/** The bell, as `HeaderBell` draws it. */
function Bell({ unread }: { readonly unread: number }) {
  const { t } = useI18n();
  return (
    <NotificationBell
      href="/notifications/"
      label={t('notify.title')}
      unreadCount={unread}
      unreadLabel={t('notify.unread', { count: unread })}
    />
  );
}

/** A super admin's role preview, as `RoleSwitchControl` wires it. */
function Switch({ viewing }: { readonly viewing: (typeof ROLES)[number] }) {
  const { t } = useI18n();
  return (
    <RoleSwitch
      value={viewing}
      ownValue="super_admin"
      label={t('view.switch')}
      viewingLabel={(role) => t('view.as', { role })}
      options={ROLES.map((role) => ({ value: role, label: t(`role.${role}`) }))}
      onChange={() => {}}
    />
  );
}

const meta = {
  title: 'Components/Navigation/AppHeader',
  tags: ['autodocs'],
  component: AppHeader,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedHeader {...args} />,
  args: { roleLabel: 'role.member', accountLabel: 'account.open' },
  argTypes: {
    align: { control: 'inline-radio', options: ['start', 'center'] },
    roleControl: { control: false },
    trailing: { control: false },
  },
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { trailing: <Bell unread={0} /> } };

export const CaseManagerWithNews: Story = {
  args: { roleLabel: 'role.admin', trailing: <Bell unread={2} /> },
};

export const Program: Story = { args: { roleLabel: 'role.provider', trailing: <Bell unread={0} /> } };

/** A super admin on their own screen: the role is an icon-only switch. */
export const SuperAdmin: Story = {
  args: { roleLabel: undefined, roleControl: <Switch viewing="super_admin" />, trailing: <Bell unread={1} /> },
};

/** A super admin previewing a member's screen. */
export const ViewingAsMember: Story = {
  args: { roleLabel: undefined, roleControl: <Switch viewing="member" />, trailing: <Bell unread={0} /> },
};

/** Signed out: nobody to show, so no role and no account. */
export const SignedOut: Story = { args: { roleLabel: undefined } };

/** Sign-in and other one-thought screens centre the mark. */
export const Centred: Story = { args: { roleLabel: undefined, align: 'center' } };

/** Sticky, for a long scrolling list. */
export const Sticky: Story = { args: { isSticky: true, trailing: <Bell unread={0} /> } };

export const Spanish: Story = {
  args: { roleLabel: 'role.super_admin', trailing: <Bell unread={3} /> },
  globals: { locale: 'es' },
};
