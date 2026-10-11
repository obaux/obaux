import { CompareTable } from '../components/CompareTable';
import { Body, Lead, P, ReadMore, Section } from '../components/Prose';
import { HowTo } from '../components/HowTo';

/**
 * Support post: I can't sign in (everyone). Words by Sage (docs/help-drafts/cant-sign-in.md), signed by Will (a57,
 * 11 October 2026). "Contact Pam" stands in for every "call Pam" (A28: no phone calls, the help desk is email).
 * Deliberately not built: the "When Add my program ships" block. Until Piper's "Add my program" is in the app, the
 * post says to write to us; swap the table row and the section when it ships.
 */
export function CantSignIn() {
  return (
    <Body>
      <Lead>You sign in to Pam with your phone number. There is no password. Pam texts you a code.</Lead>

      <Section title="Who can join, and how">
        <CompareTable
          label="Who can join Pam, and how"
          rowHeading="You are"
          columns={['How you get in']}
          rows={[
            {
              label: 'A resident',
              cells: [
                'Anyone can join on their own. Open Pam, sign in with your phone, and leave the code box empty. Pam is only in some cities for now. If it isn’t in yours yet, you can save your city.',
              ],
            },
            {
              label: 'Someone who runs a program',
              cells: [
                'Join as a resident, then ask us to add your program: contact Pam and tell us its name and address. We check it by hand, then add it so people can find it. You can also join with an invite link from a case manager, a program lead or the Pam team.',
              ],
            },
            {
              label: 'A case manager',
              cells: ['You join with an invite link. Another case manager or the Pam team can send you one.'],
            },
          ]}
        />
      </Section>

      <Section title="I want to add my program">
        <HowTo
          steps={[
            'Sign in to Pam as a resident first.',
            'Contact Pam and tell us your program’s name and address. We check it by hand, then add it so people can find it.',
          ]}
        />
      </Section>

      <Section title="I want to be a case manager">
        <HowTo
          steps={[
            'Ask a case manager you work with, or the Pam team, for an invite link. (Contact Pam, below.)',
            'The person who invites you sends you the link, by text or another app. Pam also emails it to you. Open it on your phone: it only works with the phone number it was made for.',
            'A link works once, for one person, and lasts 30 days. If it’s too old, ask for a new one.',
          ]}
        />
        <ReadMore label="More: Joining Pam as a case manager or program lead" href="/support/joining-as-staff/" />
      </Section>

      <Section title="The code didn’t come">
        <HowTo
          steps={[
            'Check your number has the area code, like 215 555 0100.',
            'Wait a minute, then tap “Send it again”.',
          ]}
        />
        <ReadMore label="More: Texts from Pam" href="/support/texts-from-pam/" />
      </Section>

      <Section title="The code didn’t work">
        <P>A code works for 10 minutes. Ask for a new one, and type the code from the newest text.</P>
      </Section>

      <Section title="The invite didn’t work">
        <HowTo
          steps={[
            '“That code is too old” or “That code was already used”: ask the person who invited you for a new one.',
            '“That code is for a different phone”: use the phone number the invite was sent to, or ask for a new invite.',
            'Already have Pam on this number? Sign in as usual. Pam finds your invite.',
          ]}
        />
        <ReadMore label="More: Joining Pam" href="/support/joining-pam/" />
      </Section>

      <Section title="Still can’t get in?">
        <P>Contact Pam and tell us what you see on the screen. We’ll get you in.</P>
      </Section>
    </Body>
  );
}
