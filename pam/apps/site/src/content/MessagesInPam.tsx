import { CompareTable } from '../components/CompareTable';
import { Body, Lead, P, ReadMore, Section } from '../components/Prose';
import { Screenshot } from '../components/Screenshot';
import { Steps } from '../components/Steps';

/**
 * Support post: Messages (everyone). Who can write to whom is a database rule (D-176,
 * migration 0063): a member may start a chat with their own case manager or a program
 * they joined, and staff with their own members; nobody else. A message never
 * queues a text (migration 0064). Left out on purpose: blocking (the terms mention it
 * but no screen has it), message translation (switched off), voice notes.
 */
export function MessagesInPam() {
  return (
    <Body>
      <Lead>
        You can message your own case manager or a program you joined, and they can message you. Nobody else
        can start a chat with you.
      </Lead>

      <Section title="Who can write to whom">
        <CompareTable
          label="Who can start a chat with whom"
          rowHeading="You are"
          columns={['You can start a chat with']}
          rows={[
            { label: 'A member', cells: ['Your own case manager, or a program you joined.'] },
            { label: 'A case manager', cells: ['The members who are assigned to you.'] },
            { label: 'A program lead', cells: ['Members who joined your program.'] },
            { label: 'A super admin', cells: ['Nobody. Messages are for members, case managers and programs.'] },
          ]}
        />
        <P>Members cannot message other members.</P>
      </Section>

      <Section title="Send a message">
        <Steps
          items={[
            'Tap Messages.',
            'Tap a conversation. Or tap “New message” and pick who you want to message.',
            'Type in the box that says “Write a message”.',
            'Tap Send.',
          ]}
        />
        <Screenshot
          name="messages-in-pam/messages.png"
          alt="The Messages screen, with a list of conversations and a “New message” button."
          caption="The Messages tab."
        />
        <Screenshot
          name="messages-in-pam/conversation.png"
          alt="A conversation. Messages go up the screen, and a box at the bottom says “Write a message”."
          caption="A conversation."
        />
        <P>You can also send a photo or a document. Tap “Add a photo” or “Add a document”.</P>
      </Section>

      <Section title="A new message does not come by text">
        <P>
          When someone messages you, the bell and the number on Home show it. Pam does not send a text for a
          message, so open Pam to read it.
        </P>
        <ReadMore label="Texts from Pam: which ones, and why one didn’t come" href="/support/texts-from-pam/" />
      </Section>

      <Section title="If a message is not safe">
        <Steps
          items={[
            'In the conversation, tap “More options”.',
            'Tap “Report suspicious activity”.',
            'Pick what is wrong.',
            'Tap “Send report”.',
          ]}
        />
        <P>
          Pam and your guide see the last message that person sent you, and its photo or document if it has one.
          Nothing else from the chat. You can report only the other person’s messages.
        </P>
        <Screenshot
          name="messages-in-pam/report.png"
          alt="The report screen. It asks what is wrong and lists reasons, with buttons “Send report” and “Never mind”."
          caption="Reporting a message."
        />
      </Section>
    </Body>
  );
}
