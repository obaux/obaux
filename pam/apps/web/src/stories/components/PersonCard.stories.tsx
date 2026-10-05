import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page, PersonCard, type PersonCardProps } from '@pam/ui';
import { DUMMY_PROGRAM_LEADS } from '@pam/config/dummy-people';
import { useStoryText } from '../support/useStoryText';

/**
 * A mentor or a program's person, summarised (§6.1). First name only — never
 * a surname, in either direction. Shared tags are chips, never free text, and
 * the card offers exactly one action.
 *
 * `roleLine` is the person's own words and is not translated, as in the app;
 * the tags and the button are PAM's and follow the Language toolbar.
 */
function LocalisedPerson({ sharedTags = [], orgBadgeLabel, messageLabel, ...rest }: PersonCardProps) {
  const tr = useStoryText();
  return (
    <PersonCard
      {...rest}
      sharedTags={sharedTags.map((tag) => tr(tag))}
      orgBadgeLabel={tr(orgBadgeLabel)}
      messageLabel={tr(`${messageLabel}?name=${rest.firstName}`)}
    />
  );
}

const sandra = DUMMY_PROGRAM_LEADS[0]!;

const meta = {
  title: 'Components/PersonCard',
  component: PersonCard,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedPerson {...args} />,
  args: {
    firstName: 'Nia',
    roleLine: 'I went back to school at 40. Ask me anything about getting started.',
    sharedTags: ['category.sub.ged_high_school', 'category.sub.kids_parenting'],
    messageLabel: 'person.message.action',
  },
  argTypes: { onMessage: { action: 'message' } },
} satisfies Meta<typeof PersonCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mentor: Story = {};

/** Verified program staff carry their organisation as a badge (§6.4). */
export const ProgramStaff: Story = {
  args: {
    firstName: sandra.firstName,
    orgBadgeLabel: sandra.orgName ?? null,
    roleLine: 'I run the GED classes on Tuesday and Thursday evenings.',
    sharedTags: ['category.sub.ged_high_school'],
  },
};

/** Nothing written yet: name, initials and the one action. */
export const Minimal: Story = { args: { firstName: 'Marcus', roleLine: null, sharedTags: [] } };

export const LongContent: Story = {
  args: {
    firstName: 'Guadalupe',
    orgBadgeLabel: 'Free Library of Philadelphia — Joseph E. Coleman Northwest Regional Library',
    roleLine:
      'I help with resumes, job applications and getting a library card. I am at the Chelten Avenue branch most weekday afternoons, and I can meet you there or talk on the phone first.',
    sharedTags: [
      'category.sub.resume_interview_help',
      'category.sub.computer_skills',
      'category.sub.job_openings',
      'category.sub.id_documents',
      'category.sub.literacy_esl',
    ],
  },
};

export const Spanish: Story = { ...LongContent, globals: { locale: 'es' } };
