import type { Meta, StoryObj } from '@storybook/nextjs';
import { CategoryArt } from '@pam/ui/CategoryArt';
import { ProgramVisitCard } from '@pam/ui/ProgramVisitCard';

/**
 * A program as one white card with a layered shadow (D-334), its category's
 * illustration as the picture (D-337), the service, day and time under its name: Plan a visit's Check step (the booked
 * screen uses `VisitCard`, D-337).
 */
const meta = {
  title: 'Components/Cards/ProgramVisitCard',
  tags: ['autodocs'],
  component: ProgramVisitCard,
  argTypes: { art: { control: false } },
  args: {
    name: 'Example Library Tech Lab',
    art: <CategoryArt category="education" size="fill" />,
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
  args: { name: 'Example Housing Help Office', art: <CategoryArt category="family_services" size="fill" /> },
};

export const Work: Story = { args: { name: 'Example Job Center', art: <CategoryArt category="workforce" size="fill" /> } };

