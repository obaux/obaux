import { CompareTable } from '../components/CompareTable';
import { Body, Lead, P, Section } from '../components/Prose';
import { Screenshot } from '../components/Screenshot';
import { Steps } from '../components/Steps';

/**
 * Support post: Sending an invite (case managers, program leads, super admins). Facts
 * from the invite screens (apps/web InviteView, InviteForWho, InviteReady, the invites
 * log) and D-373 / D-254. Left out: the expired-link "email me a new link" (queued, nothing
 * sends it yet). Pam does not send the invite: the inviter sends the link from their own
 * phone.
 */
export function SendingAnInvite() {
  return (
    <Body>
      <Lead>
        Each invite is a link for one person. You make the link in Pam and send it by text from your own phone.
      </Lead>

      <Section title="Who can invite whom">
        <CompareTable
          label="Who can invite whom"
          rowHeading="You are"
          columns={['You can invite']}
          rows={[
            { label: 'A case manager', cells: ['Members, programs and other case managers.'] },
            { label: 'A program lead', cells: ['Members and programs.'] },
            {
              label: 'A super admin',
              cells: ['Members, programs and case managers. You also choose which city the person is for.'],
            },
          ]}
        />
      </Section>

      <Section title="Make an invite">
        <Steps
          items={[
            'Tap “Invite someone”. A case manager finds it on Home and in Profile. A program lead finds it in the + menu, where it reads “Invite someone to Pam”. A super admin finds it in Profile.',
            'Choose who you are inviting: a member, a program or a case manager.',
            'Type their first name.',
            'Type their mobile number, with the area code.',
            'For a program or a case manager, type their email too.',
            'Tap “Create link”.',
            'Tap “Send the link”. Pick how to send it, or it copies the link for you to paste.',
          ]}
        />
        <Screenshot
          name="sending-an-invite/invite.png"
          alt="The invite screen. Three rows: “Invite a member”, “Invite a program” and “Invite a case manager”."
          caption="Choose who you are inviting."
        />
        <Screenshot
          name="sending-an-invite/invite-form.png"
          alt="The invite form with boxes for their first name and their mobile number, and a button that says “Create link”."
          caption="First name and mobile number."
        />
        <P>
          Pam does not text the link for you. You send it. The screen also gives a code, in case the person is on
          the phone with you: “Read them this code instead.”
        </P>
      </Section>

      <Section title="What to know about a link">
        <P>
          Only the phone number you typed can use the link. If the person signs in to Pam with that number, Pam
          finds the invite even without the link. A link works once, for one person, and it lasts 30 days.
        </P>
        <P>If a link has expired, make a new invite. Tap “Make another”.</P>
        <P>
          A phone number that already has a staff account cannot take a staff invite. The person will see “This
          number is already in Pam”.
        </P>
      </Section>

      <Section title="Seeing who joined (super admins)">
        <P>
          Super admins can see every invite. Tap “Invited people”. Each row says who invited them. “Active” means
          they joined. “Link open” means they have not used it yet. “Link expired” means the 30 days ran out.
        </P>
      </Section>
    </Body>
  );
}
