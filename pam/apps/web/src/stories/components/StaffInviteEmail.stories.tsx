import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { renderStaffInviteEmail, type StaffInviteEmailInput } from '@pam/config/invite-email';

/**
 * The first email to a case manager or a program lead who has been invited
 * (D-450), as a mail app would show it. Not the expired-link email: it does not
 * say a link ran out. A staff invite carries an email (0086); members are never
 * emailed.
 *
 * **Nobody has signed any of this yet**, in any of the seven languages, so
 * nothing sends: the sender waits for a person to write their name in
 * `reviewedBy`, and a language nobody has signed is sent in English. These are
 * drafts for Will and for native readers.
 */
const styles = stylex.create({
  frame: { width: '100%', height: '820px', borderWidth: 0 },
});

function EmailPreview(props: Omit<StaffInviteEmailInput, 'appUrl' | 'draft' | 'link'>) {
  const appUrl = typeof window === 'undefined' ? '' : window.location.origin;
  const role = props.role === 'provider' ? 'program' : 'case-manager';
  const { html } = renderStaffInviteEmail({
    ...props,
    appUrl,
    link: `${appUrl}/signin/?invite=ABCD2345&as=${role}`,
    draft: true,
  });
  return <iframe title="First invite email" srcDoc={html} {...stylex.props(styles.frame)} />;
}

const meta = {
  title: 'Onboarding/First invite email (staff)',
  component: EmailPreview,
  parameters: { layout: 'fullscreen' },
  args: { role: 'admin', inviterFirstName: 'Dana', locale: 'en' },
  argTypes: {
    role: { control: 'inline-radio', options: ['provider', 'admin'] },
    locale: { control: 'select', options: ['en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'] },
  },
} satisfies Meta<typeof EmailPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CaseManager: Story = {};
export const Program: Story = { args: { role: 'provider' } };
export const Spanish: Story = { args: { locale: 'es' } };
export const Portuguese: Story = { args: { locale: 'pt-BR' } };
export const SimplifiedChinese: Story = { args: { locale: 'zh-CN' } };
export const TraditionalChinese: Story = { args: { locale: 'zh-HK' } };
export const Russian: Story = { args: { locale: 'ru' } };
/** Right to left: the text, the button and the footer read from the right. */
export const Arabic: Story = { args: { locale: 'ar' } };
