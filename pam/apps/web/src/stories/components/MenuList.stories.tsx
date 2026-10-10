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

const GLOBE = <GlobeIcon width={26} height={26} aria-hidden />;

/** The seven languages as the Language list draws them: a short tag in English, then the name in its own language. */
const LANGUAGE_ROWS = [
  { id: 'en', tag: 'EN', lang: 'en', label: 'English', isSelected: true },
  { id: 'es', tag: 'ES', lang: 'es', label: 'Español', isSelected: false },
  { id: 'pt-BR', tag: 'PT-BR', lang: 'pt-BR', label: 'Português (Brasil)', isSelected: false },
  { id: 'zh-CN', tag: 'ZH-CN', lang: 'zh-CN', label: '简体中文', isSelected: false },
  { id: 'zh-HK', tag: 'ZH-HK', lang: 'zh-HK', label: '繁體中文', isSelected: false },
  { id: 'ru', tag: 'RU', lang: 'ru', label: 'Русский', isSelected: false },
  { id: 'ar', tag: 'AR', lang: 'ar', label: 'العربية', isSelected: false },
].map((row) => ({ ...row, onSelect: () => undefined, icon: GLOBE }));

/**
 * A short tag before a row's words (`tag`, D-449): "EN", "PT-BR", "AR" before a
 * language's own name, so a person can see which language a row is before they
 * can read it. Always English, always left to right, in a cell as wide as the
 * widest tag so the names line up, quieter than the words, and hidden from a
 * screen reader — the row's name stays the language's own. `lang` on each row
 * makes a screen reader speak "Русский" in a Russian voice.
 */
export const LanguageTags: Story = {
  args: { label: 'Language', hasDividers: true, items: LANGUAGE_ROWS },
};

/**
 * The same list read right to left. The tag sits at the start, which is the
 * right, and "PT-BR" is still "PT-BR": the tag is a left-to-right box of its own.
 */
export const LanguageTagsArabic: Story = {
  ...LanguageTags,
  globals: { locale: 'ar' },
};

/** The same list in Spanish: the tags do not translate, the page words around them do. */
export const LanguageTagsSpanish: Story = {
  ...LanguageTags,
  globals: { locale: 'es' },
};

/**
 * Profile's Language row: the tag beside the current choice (`valueTag`), so
 * somebody reviewing Profile in Russian can see which language it is in.
 */
export const ValueTag: Story = {
  args: {
    label: 'Profile',
    hasDividers: true,
    items: [
      { id: 'language', label: 'Language', href: '/language/', value: 'English', valueTag: 'EN', icon: GLOBE },
      { id: 'reminders', label: 'Reminders', href: '/reminders/', value: 'On', icon: <ClockIcon width={26} height={26} aria-hidden /> },
    ],
  },
};
