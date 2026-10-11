import { Body, Lead, P, ReadMore, Section } from '../components/Prose';
import { HowTo } from '../components/HowTo';

/**
 * Support post: Getting help from Pam (everyone). Words by Sage; the first version was signed by Will (card a51, 11
 * October 2026), and this one follows A28 (Will, 03:06: "Problem -> help desk -> email forward", "take off phone
 * number"): Pam has no phone line, so the post is the path instead. The lead is the app's `help.intro`; 988 is the
 * terms' own line (`terms.s.emergencies.p2`); the report steps are `help.safety.message.*`.
 */
export function TalkingToPam() {
  return (
    <Body>
      <Lead>Someone at Pam can help you. You do not need to know what to ask for.</Lead>

      <Section title="Start here, on the help desk" short="Find an answer">
        <HowTo
          title="Find an answer"
          steps={[
            'Search the help desk in your own words, like “my code did not come”.',
            'Open the article that fits. Most questions have one.',
          ]}
        />
      </Section>

      <Section title="Still stuck? Write to us" short="Write to us">
        <P>
          At the end of every article, and when a search finds nothing, “Still stuck?” lets you write to Pam. Tell us
          what happened and what you see on the screen. A person at Pam reads every message.
        </P>
        <P>Pam has no phone line. Writing to us is the way to reach a person.</P>
      </Section>

      <Section title="What we can help with" short="What we help with">
        <P>Getting into the app.</P>
        <P>Finding a place that can help.</P>
        <P>Changing or missing a visit.</P>
        <P>Reaching your guide.</P>
        <P>Anything else. If we cannot help, we will find someone who can.</P>
      </Section>

      <Section title="In danger right now?" short="In danger">
        <P>Call 911 first.</P>
        <P>In crisis? Call or text 988. Someone answers day and night.</P>
      </Section>

      <Section title="A message feels unsafe" short="Unsafe message">
        <HowTo
          steps={[
            'In the chat, tap ⋯ then “Report suspicious activity”.',
            'When you report, Pam sees only the last message they sent you.',
          ]}
        />
        <ReadMore label="More: Messages in Pam" href="/support/messages-in-pam/" />
      </Section>
    </Body>
  );
}
