import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { renderInviteEmail, type InviteEmailInput } from '@pam/config/invite-email';

/**
 * The email with a fresh invite link (D-263), as a mail app would show it.
 * Approved by Will (4 October); nothing sends it until an email provider is set up.
 *
 * In all seven languages (D-424). English and Spanish are signed; the other
 * five are drafts shown here for a native reader — a person who asked for the
 * link in one of them is sent the English email until it is signed.
 */
const styles = stylex.create({
  frame: { width: '100%', height: '820px', borderWidth: 0 },
});

function EmailPreview(props: Omit<InviteEmailInput, 'appUrl' | 'draft' | 'link'>) {
  const appUrl = typeof window === 'undefined' ? '' : window.location.origin;
  const role = props.role === 'provider' ? 'program' : props.role === 'admin' ? 'case-manager' : 'member';
  const { html } = renderInviteEmail({
    ...props,
    appUrl,
    link: `https://web-ten-umber-88.vercel.app/signin/?invite=ABCD2345&as=${role}`,
    draft: true,
  });
  return <iframe title="Invite email" srcDoc={html} {...stylex.props(styles.frame)} />;
}

const meta = {
  title: 'Onboarding/Invite email',
  component: EmailPreview,
  parameters: { layout: 'fullscreen' },
  args: { role: 'provider', inviterFirstName: 'Dana', locale: 'en' },
  argTypes: {
    role: { control: 'inline-radio', options: ['member', 'provider', 'admin'] },
    locale: { control: 'select', options: ['en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'] },
  },
} satisfies Meta<typeof EmailPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Program: Story = {};
export const Member: Story = { args: { role: 'member' } };
export const CaseManager: Story = { args: { role: 'admin', inviterFirstName: 'Will' } };
export const Spanish: Story = { args: { locale: 'es' } };
export const Portuguese: Story = { args: { locale: 'pt-BR' } };
export const SimplifiedChinese: Story = { args: { locale: 'zh-CN' } };
export const TraditionalChinese: Story = { args: { locale: 'zh-HK' } };
export const Russian: Story = { args: { locale: 'ru' } };
/** Right to left: the text, the button and the footer read from the right. */
export const Arabic: Story = { args: { locale: 'ar' } };
