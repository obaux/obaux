import { CompareTable } from "../components/CompareTable";
import { SIGNING_LIVE } from './rules';
import { Body, Lead, ReadMore, Section } from "../components/Prose";

/**
 * Support post: Pam words, in plain English (everyone; a table). Each meaning is what
 * the word does in the app today, from the app's own strings and decisions. "Program
 * lead" is not a label on any screen: the app says "Program partner" and "Someone who
 * runs a program", so the post says both. Left out: staff-only words (Demo view, See
 * the app as) and anything not live.
 */
export function PamWords() {
  return (
    <Body>
      <Lead>
        Some words in Pam mean something special. Here they are in plain
        English.
      </Lead>

      <Section title="The words">
        <CompareTable
          label="Words used in Pam and what they mean"
          rowHeading="Word"
          columns={["What it means"]}
          rows={[
            {
              label: "Guide",
              cells: [
                "The person who invited you to Pam, or a staff member who is responsible for guiding you.",
              ],
            },
            {
              label: "Case manager",
              cells: [
                "A staff member who helps people find programs. Your guide is usually your case manager.",
              ],
            },
            {
              label: "Member",
              cells: [
                "A person using Pam for themselves, to find places and people that can help.",
              ],
            },
            {
              label: "Program",
              cells: [
                "A place or a service people can visit, such as a class, a job program or family support.",
              ],
            },
            {
              label: "Program lead",
              cells: [
                "Someone who runs a program on Pam. In the app you may see “Program partner”, or “Someone who runs a program”.",
              ],
            },
            {
              label: "Super admin",
              cells: ["The person who runs Pam."],
            },
            {
              label: "Pam team",
              cells: ["The people who work at Pam."],
            },
            {
              label: "Invite link",
              cells: [
                "A link, sent by text, that opens Pam ready for one person. It works once and lasts 30 days.",
              ],
            },
            {
              label: "Invite code",
              cells: [
                "Letters and numbers that do the same job as a link. Someone can read it to you over the phone.",
              ],
            },
            {
              label: "Policy",
              cells: [
                SIGNING_LIVE
                  ? "A page a program asks you to read and sign before you take part. You sign it in Pam."
                  : "A document a program adds in Pam, to say what it asks of the people who take part.",
              ],
            },
            {
              label: "City",
              cells: [
                "Pam is only in some cities for now. When you join, you choose the city you live in.",
              ],
            },
            {
              label: "Points",
              cells: ["A score for things you do in Pam."],
            },
            {
              label: "Level",
              cells: [
                "Your step on the ladder. It goes up as your points go up.",
              ],
            },
            {
              label: "Badge",
              cells: [
                "A picture for a step on the ladder, or for something you have done.",
              ],
            },
            {
              label: "Limited",
              cells: [
                "An account with some things turned off. A limited account can read messages but cannot send them.",
              ],
            },
            {
              label: "Paused",
              cells: ["An account that cannot sign in for now."],
            },
          ]}
        />
      </Section>
      <ReadMore
        label="Points and badges, today"
        href="/support/points-and-badges/"
      />
    </Body>
  );
}
