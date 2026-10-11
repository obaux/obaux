import { Body, Lead, P, ReadMore, Section } from '../components/Prose';
import { HowTo } from '../components/HowTo';

/**
 * Support post: When something isn't working, start here (everyone). Words by Sage, signed by Will (card a51,
 * 11 October 2026). Every quoted line is the app's own string: `signin.phone.invalid`, `signin.code.resend`,
 * `signin.code.hint`, `signin.failed.verify.body`, `notice.invite_*`, `notice.account_*`, `notice.offline.*`,
 * `notice.something_went_wrong.*`, `notice.service_not_available.*`, `help.place.body`. "Close Pam and open it
 * again" and "check your signal or Wi-Fi" are general advice, not app strings, and Will approved them.
 * No phone number: the app shows it in one place (the same as the "Still stuck?" card).
 */
export function StartHere() {
  return (
    <Body>
      <Lead>Most problems have a simple reason. Find yours below. None of them are your fault.</Lead>

      <Section title="The code didn’t come" short="Code didn’t come">
        <HowTo
          title="What to do"
          steps={[
            'Wait a minute. Texts can be slow.',
            'Check your phone number has the area code, like 215 555 0100.',
            'Tap “Send it again”.',
          ]}
        />
        <ReadMore label="More: Texts from Pam" href="/support/texts-from-pam/" />
      </Section>

      <Section title="The code didn’t work" short="Code didn’t work">
        <HowTo
          title="What to do"
          steps={[
            'A code works for 10 minutes. After that, ask for a new one.',
            'Type the code from the newest text.',
          ]}
        />
      </Section>

      <Section title="The invite code or link didn’t work" short="Invite didn’t work">
        <HowTo
          title="What to do"
          steps={[
            '“That code is too old” or “That code was already used”: ask the person who invited you for a new one.',
            '“That code is for a different phone”: use the phone number the code was sent to, or ask for a new code.',
          ]}
        />
        <ReadMore label="More: Joining Pam" href="/support/joining-pam/" />
      </Section>

      <Section title="You can’t send messages, or your account is paused" short="Messages off, account paused">
        <HowTo
          title="What to do"
          steps={[
            'Your guide turned this off. You can still read your messages.',
            'If your account is paused, your guide can turn it back on.',
            'Contact Pam and we will help you reach your guide.',
          ]}
        />
        <ReadMore label="More: Case manager assignments" href="/support/case-manager-assignments/" />
      </Section>

      <Section title="It says “You’re offline”" short="You’re offline">
        <HowTo
          title="What to do"
          steps={[
            'Your phone lost its connection. Your saved places and your plan still work.',
            'Pam saves your changes. Try again when you have signal or Wi-Fi.',
          ]}
        />
      </Section>

      <Section title="It says “Something went wrong”, or the screen stays empty" short="Something went wrong">
        <P>This is not your fault.</P>
        <HowTo
          title="What to do"
          steps={[
            'Close Pam and open it again.',
            'If the circle keeps turning, check your signal or Wi-Fi.',
            'If it keeps happening, contact Pam and tell us what you see on the screen.',
          ]}
        />
      </Section>

      <Section title="A place is missing or wrong" short="A place is wrong">
        <HowTo
          title="What to do"
          steps={[
            '“This place is not on Pam right now”: it may come back. Contact Pam and we can help you find another place.',
            'If a place is closed, has moved or is not what it says, open it and tap “Something is wrong here”.',
          ]}
        />
      </Section>
    </Body>
  );
}
