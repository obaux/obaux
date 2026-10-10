import { CompareTable } from '../components/CompareTable';
import { Body, Lead, P, ReadMore, Section } from '../components/Prose';
import { Screenshot } from '../components/Screenshot';
import { Steps } from '../components/Steps';

/**
 * Support post: Messages (everyone). Who can write to whom is a database rule (D-176,
 * migration 0063, and 0072 / D-262): a member may start a chat with their own case manager or a
 * program they joined, and staff with their own members; a super admin with case managers and
 * program leads, never a member; nobody else. A message never
 * queues a text (migration 0064). Blocking is the ⋯ menu's "Block this person" (D-463, words from
 * en.json messages.block.* and messages.blocked.*). Left out on purpose: message translation
 * (switched off), voice notes.
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
            { label: 'A case manager', cells: ['The members who are assigned to you, and a super admin.'] },
            { label: 'A program lead', cells: ['Members who joined your program, and a super admin.'] },
            { label: 'A super admin', cells: ['Case managers and program leads. Never a member.'] },
          ]}
        />
        <P>Members cannot message other members. A super admin is the person who runs Pam.</P>
      </Section>

      <Section title="Send a message">
        <Steps
          items={[
            'Tap Messages.',
            'Tap a conversation. Or tap “New message”, the button at the top right, and pick who you want to message.',
            'Type in the box that says “Write a message”.',
            'Tap Send.',
          ]}
        />
        <Screenshot
          name="messages-in-pam/messages.png"
          alt="The Messages screen: a list of conversations, with a search button, the bell and the “New message” button at the top right."
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
          When someone messages you, the bell at the top and a dot on the Messages tab show it. A case manager or program lead also sees the number on Home. Pam does not send a text for a
          message, so open Pam to read it.
        </P>
        <ReadMore label="Texts from Pam: which ones, and why one didn’t come" href="/support/texts-from-pam/" />
      </Section>

      <Section title="If a message is not safe">
        <Steps
          items={[
            'In the conversation, tap “More options”. A screen called Options opens.',
            'Tap “Report suspicious activity”.',
            'Pick what is wrong.',
            'Tap “Send report”.',
          ]}
        />
        <Screenshot
          name="messages-in-pam/options.png"
          alt="The Options screen of a conversation, with three rows: “Stuff shared”, “Report suspicious activity” and “Block this person”."
          caption="A conversation’s Options."
        />
        <P>
          Pam and your guide see the last message that person sent you, and its photo or document if it has one.
          Nothing else from the chat. You can report only the other person’s messages.
        </P>
        <P>
          A case manager or a super admin sees reported messages on Messages, under “Reported”, next to
          “Conversations”. It says: “A message shows here only because someone said it was not safe.”
        </P>
        <Screenshot
          name="messages-in-pam/report.png"
          alt="The report screen. It asks what is wrong and lists reasons, with buttons “Send report” and “Never mind”."
          caption="Reporting a message."
        />
      </Section>

      <Section title="If you do not want messages from someone">
        <P>You can block a person from inside a conversation with them.</P>
        <Steps
          items={[
            'In the conversation, tap “More options”. A screen called Options opens.',
            'Tap “Block this person”.',
            'Read what it says. Tap “Block”, or tap “Not now” if you change your mind.',
          ]}
        />
        <P>
          Pam asks first. It says: “Neither of you will be able to send messages in this conversation or start
          a new one. What has already been said stays here, and you can still report it. They will see that
          messages are blocked. You can unblock them any time from this menu.”
        </P>
        <P>
          The other person is told. Where the box for writing a message was, they see “You can’t send messages
          here”. Under it: “This person has blocked messages in this conversation. You can still read it.
          Questions? Call Pam.”
        </P>
        <Screenshot
          name="messages-in-pam/blocked.png"
          alt="A conversation after the other person blocked it. The box for writing a message is gone. In its place: “You can’t send messages here. This person has blocked messages in this conversation. You can still read it. Questions? Call Pam.” and a link, “Call Pam for help”."
          caption="What the other person sees."
        />
        <P>
          You see “You blocked this person”. It says neither of you can send messages there, and that to
          change that you open the ⋯ menu and choose Unblock.
        </P>
        <P>
          Only the person who blocked can undo it. Open More options in the same conversation, tap “Unblock
          this person”, then tap “Unblock”. You will both be able to send messages again.
        </P>
        <P>
          Anyone in a conversation can block: a member, a case manager, a program lead or a super admin.
          Blocking does not report anyone. To report a message, use “Report suspicious activity” above.
        </P>
      </Section>
    </Body>
  );
}
