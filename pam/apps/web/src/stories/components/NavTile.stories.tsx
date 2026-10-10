import type { Meta, StoryObj } from '@storybook/nextjs';
import { BellIcon, NavTile, Page, PeopleIcon, PlacesIcon, type NavTileProps } from '@pam/ui';
import { useStoryText } from '../support/useStoryText';

/**
 * A way somewhere from Home. The whole tile is the target. Something waiting
 * shows as a count, or a dot when there is no number to give — and either way
 * the accessible name says so ("Messages, 2 new").
 */
function LocalisedTile({ label, description, alertLabel, ...rest }: NavTileProps) {
  const tr = useStoryText();
  return (
    <NavTile
      {...rest}
      label={tr(label)}
      description={tr(description)}
      {...(alertLabel ? { alertLabel: tr(alertLabel) } : {})}
    />
  );
}

const ICONS = { places: <PlacesIcon />, people: <PeopleIcon />, bell: <BellIcon /> };

const meta = {
  title: 'Components/Navigation/NavTile',
  tags: ['autodocs'],
  component: NavTile,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedTile {...args} />,
  args: {
    href: '/places/',
    icon: ICONS.places,
    label: 'places.title',
    description: 'home.go.places',
  },
  argTypes: {
    icon: { control: 'select', options: Object.keys(ICONS), mapping: ICONS },
  },
} satisfies Meta<typeof NavTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Unread messages: a count, and the count in the accessible name. */
export const WithCount: Story = {
  args: {
    href: '/messages/',
    icon: ICONS.people,
    label: 'messages.title',
    description: 'home.go.messages',
    count: 2,
    alertLabel: 'notify.unread?count=2',
  },
};

/** Something waiting with no number to give: a dot. */
export const WithDot: Story = {
  args: {
    href: '/notifications/',
    icon: ICONS.bell,
    label: 'notify.title',
    description: 'home.go.notifications',
    alertLabel: 'notify.unread?count=1',
  },
};

/** A case manager's caseload — the longest label on Home. */
export const CaseManagerPeople: Story = {
  args: { href: '/admin/', icon: ICONS.people, label: 'admin.title', description: 'home.go.caseload' },
};

export const Program: Story = {
  args: { href: '/interested/', icon: ICONS.people, label: 'interested.title', description: 'home.go.interested' },
};

export const Spanish: Story = { ...Program, globals: { locale: 'es' } };
