import type { Meta, StoryObj } from '@storybook/nextjs';
import {
  BookIcon,
  ClockIcon,
  GlobeIcon,
  LegalIcon,
  MessagesIcon,
  Page,
  PeopleIcon,
  PhoneIcon,
  PlacesIcon,
  SettingsIcon,
  SignOutIcon,
} from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';

/**
 * A plain list of places to go, one 64px row each — icon, words, chevron. Use
 * it for menus (Profile, Settings), a list of choices (Language, with a tick on
 * the chosen one) and a place's ways to get in touch; rows are links, or a
 * button for the one action that is not a place (Sign out).
 */
const meta = {
  title: 'Components/Navigation/MenuList',
  tags: ['autodocs'],
  component: MenuList,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  args: {
    label: 'Settings',
    hasDividers: false,
    items: [
      { id: 'language', label: 'Language', href: '/language/', value: 'English', icon: <GlobeIcon width={26} height={26} aria-hidden /> },
      { id: 'reminders', label: 'Reminders', href: '/reminders/', value: 'On', icon: <ClockIcon width={26} height={26} aria-hidden /> },
      { id: 'settings', label: 'Account settings', href: '/settings/', icon: <SettingsIcon width={26} height={26} aria-hidden /> },
      { id: 'legal', label: 'Legal', href: '/legal/', icon: <LegalIcon width={26} height={26} aria-hidden /> },
      { id: 'sign-out', label: 'Sign out', onSelect: () => undefined, icon: <SignOutIcon width={26} height={26} aria-hidden /> },
    ],
  },
  argTypes: {
    hasDividers: { control: 'boolean' },
  },
} satisfies Meta<typeof MenuList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Subtle lines between rows, for a list of places to pick from. */
export const WithDividers: Story = {
  args: {
    label: 'Places near you',
    hasDividers: true,
    items: [
      {
        id: 'learning',
        label: 'Example Learning Center',
        description: 'Classes for a high school diploma, free',
        href: '/places/example-learning-center/',
        icon: <BookIcon width={26} height={26} aria-hidden />,
      },
      {
        id: 'jobs',
        label: 'Northside Job Center',
        description: 'Help with a resume and finding work',
        href: '/places/northside-job-center/',
        icon: <PlacesIcon width={26} height={26} aria-hidden />,
      },
      {
        id: 'family',
        label: 'Riverside Family Services',
        description: 'Food, clothing and family support',
        href: '/places/riverside-family-services/',
        icon: <PlacesIcon width={26} height={26} aria-hidden />,
      },
    ],
  },
};

/** A list of choices: a tick and accent colour on the chosen one, no chevrons. */
export const SelectedChoice: Story = {
  args: {
    label: 'Language',
    items: [
      { id: 'en', label: 'English', isSelected: true, onSelect: () => undefined, icon: <GlobeIcon width={26} height={26} aria-hidden /> },
      { id: 'es', label: 'Español', isSelected: false, onSelect: () => undefined, icon: <GlobeIcon width={26} height={26} aria-hidden /> },
    ],
  },
};

/** New things behind a row: a count badge, or the pink "new" dot. */
export const BadgeAndDot: Story = {
  args: {
    label: 'Your people',
    hasDividers: true,
    items: [
      {
        id: 'marcus',
        label: 'Message Marcus',
        description: 'Can we move Thursday to 2 PM? I have a class at the learning center.',
        isDescriptionOneLine: true,
        href: '/messages/marcus/',
        badge: '2',
        badgeLabel: '2 new messages',
        icon: <MessagesIcon width={26} height={26} aria-hidden />,
      },
      {
        id: 'jordan',
        label: 'Jordan',
        description: 'New message',
        href: '/messages/jordan/',
        hasDot: true,
        icon: <PeopleIcon width={26} height={26} aria-hidden />,
      },
    ],
  },
};

/** Rows that leave Pam open in a new tab — directions, a program's website. */
export const ExternalLinks: Story = {
  args: {
    label: 'Get in touch',
    hasDividers: true,
    items: [
      { id: 'call', label: 'Call', description: '(555) 555-0142', href: 'tel:+15555550142', icon: <PhoneIcon width={26} height={26} aria-hidden /> },
      {
        id: 'directions',
        label: 'Get directions',
        href: 'https://maps.google.com/?q=Example+Learning+Center',
        isExternal: true,
        icon: <PlacesIcon width={26} height={26} aria-hidden />,
      },
      {
        id: 'website',
        label: 'Visit the website',
        href: 'https://example.org/',
        isExternal: true,
        icon: <GlobeIcon width={26} height={26} aria-hidden />,
      },
    ],
  },
};
