import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page } from '@pam/ui';
import { PeopleStrip, type PeopleStripProps } from '@pam/ui/PeopleStrip';
import { DUMMY_MEMBERS } from '@pam/config/dummy-people';
import { useStoryText } from '../support/useStoryText';

/**
 * A case manager's or program's people on Home, as a strip of circles (Will,
 * 16 September: "a similar layout to IG stories"). A ring means something new
 * — a message, or a newly saved place — and says which in words a screen
 * reader hears, never which place.
 */
function LocalisedStrip({ people, label }: PeopleStripProps) {
  const tr = useStoryText();
  return (
    <PeopleStrip
      label={tr(label)}
      people={people.map((person) => ({
        ...person,
        ...(person.activityLabel ? { activityLabel: tr(person.activityLabel) } : {}),
      }))}
    />
  );
}

/** The example caseload, with a ring on whoever has something new — as `HomePeopleSection` ranks it. */
const caseload: PeopleStripProps['people'] = DUMMY_MEMBERS.map((person, index) => {
  const reason = index === 0 ? 'message' : person.lastSavedAt ? 'save' : null;
  return {
    id: person.id,
    firstName: person.firstName,
    href: `/person/?id=${encodeURIComponent(person.id)}`,
    hasActivity: reason !== null,
    ...(reason ? { activityLabel: `people.new.${reason}` } : {}),
  };
});

const meta = {
  title: 'Components/PeopleStrip',
  component: PeopleStrip,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedStrip {...args} />,
  args: { label: 'admin.members.title', people: caseload },
} satisfies Meta<typeof PeopleStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A case manager's members. */
export const CaseManager: Story = {};

/** Nobody has done anything new: no rings. */
export const NothingNew: Story = {
  args: { people: caseload.map(({ activityLabel: _unused, ...person }) => ({ ...person, hasActivity: false })) },
};

/** A program's interested people — two of them. */
export const FewPeople: Story = { args: { label: 'interested.title', people: caseload.slice(0, 2) } };

/** A first name too long for the circle truncates rather than wrapping. */
export const LongNames: Story = {
  args: {
    people: [
      { id: 'l1', firstName: 'Maximiliano', href: '#', hasActivity: true, activityLabel: 'people.new.message' },
      { id: 'l2', firstName: 'Anastasia-Marie', href: '#' },
      ...caseload,
    ],
  },
};

export const Spanish: Story = { ...LongNames, globals: { locale: 'es' } };
