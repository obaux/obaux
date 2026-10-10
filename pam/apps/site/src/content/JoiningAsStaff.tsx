import { Body, Lead, P, Section } from '../components/Prose';
import { Screenshot } from '../components/Screenshot';
import { Steps } from '../components/Steps';

/**
 * Support post: Joining as a case manager or a program lead (staff). Staff join by an
 * invite link only: Will, 7 October (D-369): "we won't be asking this question any
 * longer, since we'll have special links for login for programs and case managers.
 * We don't want to let members select that they're a staff by mistake." There is no
 * screen that asks to be staff (the request path is built but nothing calls it), so
 * this post does not describe a request. The Staff requests post is a hidden draft.
 */
export function JoiningAsStaff() {
  return (
    <Body>
      <Lead>
        Case managers and program leads join Pam with an invite link. There is no button to sign up as staff.
        This keeps people from joining as staff by mistake.
      </Lead>

      <Section title="Join with your link">
        <Steps
          items={[
            'Open the link you were sent. Open it on the phone it was sent to.',
            'Sign in with your phone number and the code Pam texts you. The top of the screen says you were invited, for example “You were invited to be a case manager in the Pam network.”',
            'On “About you”, check your first name. A green line shows what you were invited as: “Case manager” or “Program partner”.',
            'Read the next screen. A case manager sees “What you will see”. A program sees “What to expect”. Tap “I understand”.',
            'You land on Home.',
          ]}
        />
        <Screenshot
          name="joining-as-staff/sign-in.png"
          alt="Pam’s sign-in screen for a person invited to be a case manager. A line at the top says they were invited."
          caption="Sign in, for someone invited as a case manager."
        />
      </Section>

      <Section title="If you do not have a link">
        <P>
          Ask the person at Pam who works with you to send you one. A case manager or a Pam super admin can send
          one. If you do not know who to ask, call Pam.
        </P>
        <P>
          A link works once and only on the phone number it was made for. It lasts 30 days. If it has expired,
          ask for a new one.
        </P>
      </Section>

      <Section title="If your number is already in Pam">
        <P>
          One phone number can have one account. If your number already has an account, the staff link shows
          “This number is already in Pam”. Ask for the link to be sent to a different number.
        </P>
      </Section>
    </Body>
  );
}
