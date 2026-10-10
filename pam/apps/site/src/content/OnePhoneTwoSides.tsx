import { CompareTable } from '../components/CompareTable';
import { Body, Lead, P, Section } from '../components/Prose';
import { Screenshot } from '../components/Screenshot';
import { Steps } from '../components/Steps';

/**
 * Support post: One phone, two sides (program leads who are also members). The two-roles
 * design is live (D-373 to D-376; migration 0078 live 8 October). Only a member and a
 * program lead can share an account. Left out: the "dot on the switch" and notifications
 * split by side, which are design only (D-375, "Not in this build").
 */
export function OnePhoneTwoSides() {
  return (
    <Body>
      <Lead>
        If you run a program and you also use Pam for yourself, you can keep one account for both. You switch
        between the two sides whenever you want.
      </Lead>

      <Section title="Switch sides">
        <Steps
          items={[
            'Tap Profile.',
            'Tap “Use Pam as”.',
            'Tap “Me” or “My program”. The side you are using has a tick.',
            'Pam takes you to Home, on that side.',
          ]}
        />
        <P>You only see “Use Pam as” if your account has both sides.</P>
        <Screenshot
          name="one-phone-two-sides/use-as.png"
          alt="The “Use Pam as” screen. Two rows: “Me”, with your visits, saved places and points, and “My program”, with who is coming in, your program and its messages."
          caption="“Use Pam as”."
        />
        <CompareTable
          label="What each side is for"
          rowHeading="Side"
          columns={['What you see']}
          rows={[
            { label: 'Me', cells: ['Your visits, saved places and points.'] },
            { label: 'My program', cells: ['Who is coming in, your program and its messages.'] },
          ]}
        />
      </Section>

      <Section title="What stays separate">
        <P>
          People at your own program do not see your visits, saved places or activity as a member. You can’t book
          your own program as a member. While you are on one side, the other side’s information is out of reach
          until you switch back.
        </P>
        <P>Notifications for both sides show in the same bell.</P>
      </Section>

      <Section title="Add your program to an account you already have">
        <Steps
          items={[
            'Ask to be invited to your program, using the phone number you already use for Pam. The invite is made for that number.',
            'Open the link and sign in with the code Pam texts you.',
            'Pam shows “Add your program to your account”. It says you can keep one account for both.',
            'Tap “Add my program”. Tap “Not now” if you would rather wait.',
          ]}
        />
        <P>Your program has to be in the same city as your account.</P>
        <Screenshot
          name="one-phone-two-sides/add-your-program.png"
          alt="The “Add your program to your account” screen, with a short list of what changes and a button that says “Add my program”."
          caption="“Add your program to your account”."
        />
      </Section>
    </Body>
  );
}
