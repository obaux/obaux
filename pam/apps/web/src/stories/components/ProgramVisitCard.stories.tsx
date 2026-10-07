import type { Meta, StoryObj } from '@storybook/nextjs';
import { EducationIcon, FamilyServicesIcon, WorkforceIcon } from '@pam/ui';
import { ProgramVisitCard } from '@pam/ui/ProgramVisitCard';

const ART = { width: 36, height: 36, 'aria-hidden': true } as const;

/**
 * A program as one white card with a layered shadow (D-334), its picture in
 * its category's colour, the service, day and time under its name: Plan a visit's Check step and the booked
 * screen (D-333).
 */
const meta = {
  title: 'Components/Cards/ProgramVisitCard',
  tags: ['autodocs'],
  component: ProgramVisitCard,
  argTypes: {
    tone: { control: 'select', options: [null, 'blue', 'green', 'purple', 'orange', 'red', 'teal', 'pink', 'cyan', 'gray'] },
    art: { control: false },
  },
  args: {
    name: 'Example Library Tech Lab',
    tone: 'blue',
    art: <EducationIcon {...ART} />,
    lines: ['Tuesday, October 13 · 9:00 AM'],
  },
} satisfies Meta<typeof ProgramVisitCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** With a service picked, it comes before the day (D-313). */
export const WithService: Story = {
  args: { lines: ['Computer classes', 'Tuesday, October 13 · 9:00 AM'] },
};


export const FamilyServices: Story = {
  args: { name: 'Example Housing Help Office', tone: 'purple', art: <FamilyServicesIcon {...ART} /> },
};

export const Work: Story = { args: { name: 'Example Job Center', tone: 'green', art: <WorkforceIcon {...ART} /> } };

/** No tone: a plain picture.*/
export const NoTone: Story = { args: { tone: null } };
