import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { CategoryArt } from '@pam/ui/CategoryArt';
import { TripCard } from '@pam/ui/TripCard';
import { useStoryText } from '../support/useStoryText';

/** The policy chip says the app's own words (read from the bundle: args are keys). Place names and times are data. */
function Localised(props: ComponentProps<typeof TripCard>) {
  const tr = useStoryText();
  return <TripCard {...props} policies={props.policies ? { ...props.policies, label: tr(props.policies.label) } : null} />;
}

/** One visit a member has agreed to make — the place, the day and time, and who they are meeting; the whole card opens the place. Use it in the Trips list. */
const meta = {
  title: 'Components/Cards/TripCard',
  tags: ['autodocs'],
  component: TripCard,
  render: (args) => <Localised {...args} />,
  args: {
    placeName: 'Example Learning Center',
    when: 'Thursday, Oct 8 · 10:00 AM',
    href: '/place/?id=dummy-place-learning&from=trips',
    art: <CategoryArt category="education" size="fill" />,
    withName: 'Sandra',
    withPhotoUrl: null,
    label: 'Example Learning Center, Thursday, Oct 8 · 10:00 AM, with Sandra',
    policies: null,
  },
  argTypes: { art: { control: false } },
} satisfies Meta<typeof TripCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The program asks for policies that are not signed yet. */
export const SignaturesNeeded: Story = {
  args: { policies: { label: 'trips.policies.needed', isDone: false } },
};

/** Every policy signed. */
export const PoliciesSigned: Story = {
  args: {
    placeName: 'Example Workforce Center',
    when: 'Sunday, Oct 11 · 1:00 PM',
    href: '/place/?id=dummy-place-workforce&from=trips',
    art: <CategoryArt category="workforce" size="fill" />,
    withName: 'Marcus',
    label: 'Example Workforce Center, Sunday, Oct 11 · 1:00 PM, with Marcus',
    policies: { label: 'trips.policies.signed', isDone: true },
  },
};

/** Nobody named to meet and no policies: just the place and the time. */
export const PlaceOnly: Story = {
  args: {
    placeName: 'Example Family Center',
    art: <CategoryArt category="family_services" size="fill" />,
    withName: null,
    label: 'Example Family Center, Thursday, Oct 8 · 10:00 AM',
  },
};

/** A long program name ends in "…"; the full name stays in the card's label. */
export const LongName: Story = {
  args: {
    placeName: 'Free Library of Philadelphia — Joseph E. Coleman Northwest Regional Library',
    label: 'Free Library of Philadelphia — Joseph E. Coleman Northwest Regional Library, Thursday, Oct 8 · 10:00 AM, with Sandra',
    policies: { label: 'trips.policies.needed', isDone: false },
  },
};
