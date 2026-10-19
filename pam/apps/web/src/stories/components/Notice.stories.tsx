import type { Meta, StoryObj } from '@storybook/nextjs';
import { VStack } from '@astryxdesign/core/VStack';
import { CompactNotice, Notice, NoticeSinkContext, Page, type NoticeProps } from '@pam/ui';
import { NOTICES, type NoticeKey } from '@pam/config';
import { useStoryText } from '../support/useStoryText';

/**
 * How Pam says something went wrong, or that there is nothing here (§0: never
 * dead-end). A problem the reader must act on is a status card with
 * `role="alert"`; an empty area is Astryx's EmptyState. Which one, and whether
 * it offers Contact Pam, is decided by `@pam/config/notices` — not by the screen.
 *
 * Every story takes its title and body from the same i18n keys the app uses
 * (`notice.<key>.title` / `.body`, or the screen's own key where it has one).
 */
function LocalisedNotice({ title, body, contactLabel, retry, userFacingNote, ...rest }: NoticeProps) {
  const tr = useStoryText();
  return (
    <Notice
      {...rest}
      title={tr(title)}
      {...(body ? { body: tr(body) } : {})}
      {...(contactLabel ? { contactLabel: tr(contactLabel) } : {})}
      userFacingNote={userFacingNote}
      {...(retry ? { retry: { label: tr(retry.label), onPress: retry.onPress } } : {})}
    />
  );
}

/** The args for a notice exactly as `@pam/config` defines it. */
function forKey(notice: NoticeKey): Pick<NoticeProps, 'notice' | 'title' | 'body'> {
  return { notice, title: NOTICES[notice].titleKey, body: NOTICES[notice].bodyKey };
}

const meta = {
  title: 'Components/Feedback/Notice',
  tags: ['autodocs'],
  component: Notice,
  decorators: [
    // The card itself (the app draws a status Notice as a toast, D-619: see Components/Feedback/Notice toast): no sink here.
    (Story) => (
      <NoticeSinkContext.Provider value={null}>
        <Page gap={4}>
          <Story />
        </Page>
      </NoticeSinkContext.Provider>
    ),
  ],
  render: (args) => <LocalisedNotice {...args} />,
  args: {
    ...forKey('something_went_wrong'),
    contactLabel: 'help.contact.action',
  },
  argTypes: {
    notice: { control: 'select', options: Object.keys(NOTICES) },
  },
} satisfies Meta<typeof Notice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * With the optional extra action, drawn before Contact Pam. No screen passes one
 * yet, and the locale files have no "Try again" key, so this borrows "Go back".
 */
export const WithExtraAction: Story = {
  args: { retry: { label: 'action.goBack', onPress: () => {} } },
};

export const Offline: Story = { args: forKey('offline') };

export const AccountPaused: Story = { args: forKey('account_suspended') };

export const SomeThingsTurnedOff: Story = { args: forKey('account_limited') };

/**
 * The calm card (D-432): what a limited member meets on Messages and in a
 * conversation. More room, the smallest body text (16px), and Contact Pam as a
 * link rather than a primary button.
 */
export const SomeThingsTurnedOffQuiet: Story = { args: { ...forKey('account_limited'), quiet: true } };

export const FeatureTurnedOff: Story = { args: forKey('feature_turned_off') };

/**
 * An admin's own plain note replaces the generic body. The internal reason on
 * that row is never passed here (§4.1).
 */
export const WithNoteFromCaseManager: Story = {
  args: {
    ...forKey('feature_turned_off'),
    userFacingNote: 'Messages are off until we meet on Thursday. Call me at the office if anything comes up.',
  },
};

/** No label given: the Contact Pam action is left out rather than drawn unlabelled. */
export const WithoutContact: Story = { args: { contactLabel: undefined } };

/** As `/place/` shows it when the id is not in the catalogue. */
export const PlaceNotFound: Story = {
  args: {
    notice: 'service_not_available',
    title: 'place.notFound.title',
    body: 'place.notFound.body',
  },
};

/** Empty: the Places list in an area with nothing in it. */
export const NoPlacesFound: Story = { args: forKey('no_places_found') };

/** Empty: a search that matched nothing, as Places words it. */
export const SearchMatchedNothing: Story = {
  args: { notice: 'no_places_found', title: 'places.search.none.title', body: 'places.search.none.body' },
};

/** Empty: a case manager before anyone has used their invite code. */
export const NoCaseloadYet: Story = { args: forKey('no_caseload_members') };

export const NoMentorsYet: Story = { args: forKey('no_mentors_found') };

export const InviteCodeExpired: Story = { args: forKey('invite_expired') };

export const OutOfRegion: Story = { args: forKey('admin_out_of_region') };

export const Spanish: Story = { args: forKey('account_limited'), globals: { locale: 'es' } };

/**
 * The small alert (D-510), for a mistake the person fixes where they are: one row,
 * a small icon and one line, no button. The full `Notice` above is for a state they
 * are stuck in. Same three tones. Below: the same wrong-code moment drawn both ways,
 * which is why the sign-in code step uses the small one.
 */
function CompactAll() {
  const tr = useStoryText();
  return (
    <VStack gap={3}>
      <CompactNotice status="error" text={tr('signin.code.wrong') ?? ''} />
      <CompactNotice status="warning" text={tr('signin.code.wrong') ?? ''} />
      <CompactNotice status="info" text={tr('signin.code.wrong') ?? ''} />
    </VStack>
  );
}

export const Compact: StoryObj = { render: () => <CompactAll /> };

export const CompactSpanish: StoryObj = { render: () => <CompactAll />, globals: { locale: 'es' } };

export const CompactArabic: StoryObj = { render: () => <CompactAll />, globals: { locale: 'ar' } };
