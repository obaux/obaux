import type { Meta, StoryObj } from '@storybook/nextjs';
import { Notice, Page } from '@pam/ui';
import { useStoryText } from '../../support/useStoryText';
import { screen } from '../screen';

/**
 * The privacy step of signing up as a case manager ("What you will see") and as a program lead ("What to expect"), each as an
 * invited person reaches it and as somebody who asked to join (no invite), who is then told "We will text you" (`join.staff.*`).
 * Their Sign up stories open on the first step ("About you"), and the language-fit audit measures only what a story has drawn, so
 * these steps and their titles were never measured in any language, and the Join preview always has an account (so it never draws the
 * "We will text you" notice), which has its own story below. One story each.
 */
const meta = { title: 'Onboarding/Staff privacy step' } satisfies Meta;

export default meta;
type Story = StoryObj;

const PATH = '/prototype/join/';

/** A case manager with an invite: "What you will see". */
export const CaseManagerInvited: Story = screen('case-manager', 'Case manager, invited — what you will see', PATH, {
  kind: 'admin',
  invite: 'PAM-7Q4K',
  step: 'privacy',
});

/** A case manager who asked to join (no invite): the same step. The notice that follows it in the app is the last story below. */
export const CaseManagerAsked: Story = screen('case-manager', 'Case manager, asked — what you will see', PATH, {
  kind: 'admin',
  step: 'privacy',
});

/** A program lead with an invite: "What to expect". */
export const ProgramLeadInvited: Story = screen('provider', 'Program lead, invited — what to expect', PATH, {
  kind: 'provider',
  invite: 'PAM-7Q4K',
  step: 'privacy',
});

/** A program lead who asked to join (no invite): the same step. The notice that follows it in the app is the last story below. */
export const ProgramLeadAsked: Story = screen('provider', 'Program lead, asked — what to expect', PATH, {
  kind: 'provider',
  step: 'privacy',
});

/**
 * "We will text you" (`join.staff.*`), as the Join screen draws it for somebody who asked to join and has no account: a Notice with Contact
 * Pam. The Join preview sets an account, so the real screen cannot show it in a story; this is the same Notice with the same keys on a plain
 * page, which is what decides how the words fit.
 */
function AskedNotice() {
  const tr = useStoryText();
  return (
    <Page gap={4}>
      <Notice
        notice="service_not_available"
        title={tr('join.staff.title')}
        body={tr('join.staff.body')}
        contactLabel={tr('help.contact.action')}
      />
    </Page>
  );
}

export const AskedNoticeOnItsOwn: Story = {
  name: 'We will text you (somebody who asked, with no account)',
  render: () => <AskedNotice />,
};
