import type { Meta, StoryObj } from '@storybook/nextjs';
import { Notice, Page, type NoticeProps } from '@pam/ui';
import { NOTICES, type NoticeKey } from '@pam/config';
import { useStoryText } from '../support/useStoryText';

/**
 * How PAM says something went wrong, or that there is nothing here (§0: never
 * dead-end). A problem the reader must act on is a status card with
 * `role="alert"`; an empty area is Astryx's EmptyState. Which one, and whether
 * it offers a call, is decided by `@pam/config/notices` — not by the screen.
 *
 * Every story takes its title and body from the same i18n keys the app uses
 * (`notice.<key>.title` / `.body`, or the screen's own key where it has one).
 */
const SUPPORT_PHONE = '+12673095265';

function LocalisedNotice({ title, body, callLabel, retry, userFacingNote, ...rest }: NoticeProps) {
  const tr = useStoryText();
  return (
    <Notice
      {...rest}
      title={tr(title)}
      body={tr(body)}
      callLabel={tr(callLabel ?? 'help.callSupport')}
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
  title: 'Components/Notice',
  component: Notice,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedNotice {...args} />,
  args: {
    ...forKey('something_went_wrong'),
    supportPhone: SUPPORT_PHONE,
    callLabel: 'help.callSupport',
  },
  argTypes: {
    notice: { control: 'select', options: Object.keys(NOTICES) },
  },
} satisfies Meta<typeof Notice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SomethingWentWrong: Story = {};

/**
 * With the optional extra action, drawn before the call. No screen passes one
 * yet, and the locale files have no "Try again" key, so this borrows "Go back".
 */
export const WithExtraAction: Story = {
  args: { retry: { label: 'action.goBack', onPress: () => {} } },
};

export const Offline: Story = { args: forKey('offline') };

export const AccountPaused: Story = { args: forKey('account_suspended') };

export const SomeThingsTurnedOff: Story = { args: forKey('account_limited') };

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

/** No support line known: the call action is left out rather than drawn dead. */
export const WithoutSupportPhone: Story = { args: { supportPhone: null } };

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
