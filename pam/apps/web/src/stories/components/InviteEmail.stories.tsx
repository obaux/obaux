import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { renderInviteEmail, type InviteEmailInput } from '@pam/config/invite-email';

/**
 * The email with a fresh invite link (D-263), as a mail app would show it.
 * A draft: `INVITE_EMAIL.reviewedBy` is empty, so nothing sends it yet.
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
    locale: { control: 'inline-radio', options: ['en', 'es'] },
  },
} satisfies Meta<typeof EmailPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Program: Story = {};
export const Member: Story = { args: { role: 'member' } };
export const CaseManager: Story = { args: { role: 'admin', inviterFirstName: 'Will' } };
export const Spanish: Story = { args: { locale: 'es' } };
