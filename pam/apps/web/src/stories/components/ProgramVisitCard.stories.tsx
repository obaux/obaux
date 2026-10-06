import type { Meta, StoryObj } from '@storybook/nextjs';
import { EducationIcon, FamilyServicesIcon, WorkforceIcon } from '@pam/ui';
import { ProgramVisitCard } from '@pam/ui/ProgramVisitCard';

const ART = { width: 36, height: 36, 'aria-hidden': true } as const;

/**
 * A program as one card, in its category's colour (D-332). `visit` shows the
 * day and time being booked (Plan a visit › Check); `invite` puts you and an
 * empty "+" beside the picture, with no date (Bring a friend › Go together).
 */
const meta = {
  title: 'Components/Cards/ProgramVisitCard',
  tags: ['autodocs'],
  component: ProgramVisitCard,
  argTypes: {
    variant: { control: 'radio', options: ['visit', 'invite'] },
    tone: { control: 'select', options: [null, 'blue', 'green', 'purple', 'orange', 'red', 'teal', 'pink', 'cyan', 'gray'] },
    art: { control: false },
  },
  args: {
    name: 'Example Library Tech Lab',
    tone: 'blue',
    art: <EducationIcon {...ART} />,
    lines: ['Tuesday, October 13 · 9:00 AM'],
    variant: 'visit',
  },
} satisfies Meta<typeof ProgramVisitCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** With a service picked, it comes before the day (D-313). */
export const WithService: Story = {
  args: { lines: ['Computer classes', 'Tuesday, October 13 · 9:00 AM'] },
};

/** Go together: you and a friend, no date. "You" takes the category's deep shade. */
export const Invite: Story = { args: { variant: 'invite', lines: [] } };

export const InviteWork: Story = {
  args: { variant: 'invite', lines: [], name: 'Example Job Center', tone: 'green', art: <WorkforceIcon {...ART} /> },
};

export const FamilyServices: Story = {
  args: { name: 'Example Housing Help Office', tone: 'purple', art: <FamilyServicesIcon {...ART} /> },
};

/** No tone: a white card and the accent green "you". */
export const NoTone: Story = { args: { tone: null, variant: 'invite', lines: [] } };
