/**
 * Everything Pam asks a person to type, say, pick or allow, with the line of the Privacy page that says Pam
 * keeps it. The privacy guard (`test/privacy-guard.test.ts`, the weekly note of 16 October, approved 10 October)
 * reads this file and the app's source together:
 *
 *  - A screen or component that has a field, a file picker, a signature pad, a microphone or a location request
 *    must be in `INPUT_FILES`, with the number of them it has. Add a field, and the count is wrong, and the test
 *    says which file and asks what the new field collects.
 *  - What a file collects points at an entry in `DATA_COLLECTED`. An entry either names the Privacy keys that
 *    cover it (and the words those keys must still say, so rewording a line cannot quietly stop covering what it
 *    was put there to cover) or is an open gap, with the card it waits on.
 *
 * The guard cannot read English and cannot tell whether a line is *enough*; it makes sure nobody adds a field
 * without somebody deciding which line covers it. A gap is not a failure, it is a record: the page does not say
 * it yet, and a person who has to decide is named. When a line is signed, the entry moves from `gap` to `covers`.
 *
 * Paths are relative to the `pam/` folder.
 */

export interface PrivacyCover {
  /** Keys of `en.json` (Privacy page lines). Every one must exist. */
  readonly keys: readonly string[];
  /** Words or phrases, each of which must still appear in the English of at least one of the keys. */
  readonly says: readonly string[];
}

export interface CollectedData {
  readonly id: string;
  /** In plain words: what a person gives Pam here. */
  readonly what: string;
  /** The Privacy lines that cover it, or null while the page does not say it yet (then `gap` is required). */
  readonly covers: PrivacyCover | null;
  /** Why it is not covered and who decides: a card (a84) or "for Will". Required when `covers` is null. */
  readonly gap?: string;
}

export const DATA_COLLECTED: readonly CollectedData[] = [
  {
    id: 'phone',
    what: 'The phone number a person signs in with, and the code texted to it.',
    covers: {
      keys: ['privacy.s.what-we-keep.p1', 'privacy.s.texts.p1'],
      says: ['phone number', 'text you a code'],
    },
  },
  {
    id: 'first-name',
    what: 'A first name, typed on About you.',
    covers: { keys: ['privacy.s.what-we-keep.p1'], says: ['first name'] },
  },
  {
    id: 'last-name-and-city',
    what:
      'A last name (optional) and a city (required), typed or picked on About you by everyone, member or staff. ' +
      'Both are written to the profile (`updateMyDetails`, `redeem_invite`: `last_name`, `home_city`). Only the ' +
      'Pam team reads them: nobody signed in can select either column, their own included (20261016145411, test 74).',
    covers: {
      keys: ['privacy.s.what-we-keep.p1'],
      says: ['your last name if you give it', 'your city', 'only the pam team can see your last name and your city'],
    },
  },
  {
    id: 'waiting-list-text',
    what:
      'In a city Pam is not in yet: the city, kept with the phone number (`join_waiting_city`). The "Text me when ' +
      'Pam opens in {city}" tick is gone (build 3, option A, Will signed a96 on 17 October): nothing sent that text, ' +
      'so nobody is asked for it. The line covers the city and the number.',
    covers: {
      keys: ['privacy.s.what-we-keep.p14'],
      says: ['not in your city yet', 'the city you typed', 'your phone number', 'only the pam team can see them'],
    },
  },
  {
    id: 'typed-for-someone-new',
    what:
      'A first name and number typed by a program lead (Add a person, D-322) or a case manager or lead (Invite someone) ' +
      'for a person who has not joined yet; Pam texts them a link.',
    covers: {
      keys: ['privacy.s.what-we-keep.p1', 'privacy.s.texts.p1'],
      says: ['first name', 'phone number'],
    },
  },
  {
    id: 'email',
    what:
      'An email address: a staff member\'s, typed for an invite (D-441), or one a member types on the expired-link page ' +
      '(D-490, deleted once the email is sent).',
    covers: {
      keys: ['privacy.s.what-we-keep.p7', 'privacy.s.sharing.p4'],
      says: ['email address', 'company that sends email'],
    },
  },
  {
    id: 'address-typed',
    what: 'Words typed into the place search (a street address, a corner), which can go to Google to suggest places (D-552).',
    covers: { keys: ['privacy.s.sharing.p7'], says: ['street address', 'Google'] },
  },
  {
    id: 'location-here',
    what: 'The phone\'s position, once, when a person taps "I\'m here" on a visit (`lib/imHere.ts`).',
    covers: { keys: ['privacy.s.what-we-keep.p9'], says: ['location', 'I’m here'] },
  },
  {
    id: 'location-near',
    what: 'The phone\'s position, for one "near me" search (`AreaPicker`).',
    covers: { keys: ['privacy.s.what-we-keep.p10'], says: ['search near you', 'location'] },
  },
  {
    id: 'messages',
    what: 'What a person writes in a conversation, and the photos, PDF or Word files and links they send in it.',
    covers: {
      keys: [
        'privacy.s.what-we-keep.p3',
        'privacy.s.what-we-keep.p4',
        'privacy.s.what-we-keep.p5',
        'privacy.s.what-we-keep.p6',
        'privacy.s.translation.p1',
        'privacy.s.translation.p2',
      ],
      says: ['messages, photos and documents', 'Before a photo leaves your phone', 'PDF', 'preview', 'Claude'],
    },
  },
  {
    id: 'signature',
    what: 'A name typed and a signature drawn to sign a program\'s rules.',
    covers: { keys: ['privacy.s.what-we-keep.p8'], says: ['signature'] },
  },
  {
    id: 'visit-note',
    what: 'A note to the program, written when planning a visit (`NewTripView`).',
    covers: { keys: ['privacy.s.sharing.p2'], says: ['what you write to them'] },
  },
  {
    id: 'help-desk-reply',
    what: 'The reply the Pam team types to a person who wrote to the help desk; it goes to them as a text (D-583).',
    covers: {
      keys: ['privacy.s.contact.p1', 'privacy.s.texts.p1'],
      says: ['A person reads every message', 'text you a code'],
    },
  },
  {
    id: 'place-report',
    what: 'A reason and an optional note about a place that is closed or wrong (`/flag/`); every case manager and super admin reads it (D-585).',
    covers: {
      keys: ['privacy.s.what-we-keep.p15'],
      says: [
        'if you report a place',
        'case managers and the pam team can read it',
        'nobody at the place is told who reported it',
        'the report stays',
      ],
    },
  },
  {
    id: 'staff-photo',
    what:
      'A staff member\'s own profile photo, picked on Profile (D-345); members see it. Only the current one is kept: ' +
      'the old file is removed when a new photo is saved, and each night `sweep-staff-photos` removes every file no ' +
      'account points at, so a deleted account\'s photo is gone by the next morning (D-587 build 2).',
    covers: {
      keys: ['privacy.s.what-we-keep.p16'],
      says: [
        'a photo of yourself',
        'anyone who has its web address',
        'we delete the old one',
        'we delete your photo too',
      ],
    },
  },
  {
    id: 'program-details',
    what: 'A program\'s name, kind, address, phone, website, description and services, typed by its lead (join, Program tab).',
    covers: {
      keys: ['privacy.s.sharing.p8'],
      says: ['and description are shown on pam', 'the services it lists', 'with their details and hours'],
    },
  },
  {
    id: 'language',
    what: 'The language a person picks: in the sign-in menu, on Profile, and on Join (`LanguageSwitcher`, `LanguageField`).',
    covers: { keys: ['privacy.s.what-we-keep.p1'], says: ['the language you pick'] },
  },
  {
    id: 'calendar-details',
    what: 'The switch on the calendar screen: whether the calendar link shows each place\'s name and address (`CalendarLinkView`).',
    covers: {
      keys: ['privacy.s.what-we-keep.p12'],
      says: ['whether you turned on the place\'s name and address'],
    },
  },
  {
    id: 'visit-service',
    what: 'The service a member picks when planning a visit (`ServiceCards`, a selectable card); the program sees it for that visit.',
    covers: {
      keys: ['privacy.s.what-we-keep.p2', 'privacy.s.sharing.p2'],
      says: ['the visits you plan', 'the service you picked'],
    },
  },
  {
    id: 'text-alerts',
    what:
      'A person\'s yes to texts and to each kind of text, the four Text alerts switches (`AlertsView`; `useReminderConsent`): ' +
      'kept on the account with whether they replied STOP.',
    covers: null,
    gap:
      'For Will (a102, the text line that waits for his signature): `privacy.s.texts.p1` says Pam may text reminders and updates ' +
      'about an account, not that the yes, which kinds, or a STOP is kept on the account.',
  },
  {
    id: 'message-report',
    what: 'The reason a person picks when they report a message that is not safe (`ThreadOptionsViews`), kept with the report that staff read.',
    covers: null,
    gap:
      'For Will (the reported-message clause, with a102): `privacy.s.who-can-see.p3` says staff see a reported message; ' +
      'no line says the reason and the report are kept.',
  },
  {
    id: 'staff-region',
    what:
      'The city (region) a super admin picks for a person they invite or approve (`InviteNewView`, `RequestReviewScreen`): ' +
      'kept on that person\'s account (`profiles.region_id`) and shown in the Everyone list. It is data about the person, even though ' +
      'they do not choose it.',
    covers: null,
    gap:
      'For Will (the desk, Mira 19 October): `privacy.s.what-we-keep.p1` covers a city the person gives about themselves ' +
      '(`home_city`, picked on About you); no line says Pam also keeps the city a staff member serves, which Pam\'s team chooses.',
  },
];

/**
 * The components the guard counts, one for each place a person types, says, picks or switches something on a screen
 * (`<Name` in the source, comments removed). A field, a file picker, a signature pad and a microphone are here, and so
 * are the choice controls: a radio list, a switch, a selectable card, a dropdown, a time input. A choice is something
 * a person tells Pam, even when no word is typed (their language, whether texts are on, which service they want).
 */
export const COUNTED_COMPONENTS: readonly string[] = [
  'TextField',
  'TextArea',
  'SearchField',
  'SearchPill',
  'CheckboxInput',
  'CheckboxList',
  'VoiceInput',
  'SignaturePad',
  'ChatComposerInput',
  'StaffInviteEmailInput',
  'InviteEmailInput',
  'PolicyUploadCard',
  'input',
  'textarea',
  // The choice controls (19 October, Mira 00:44): not SegmentedControl, which switches between views and stores nothing.
  'RadioList',
  'Switch',
  'SelectableCard',
  'Selector',
  'Dropdown',
  'DropdownMenuRadioGroup',
  'TimeInput',
];

/**
 * Every component whose name sounds like an input and that a screen imports from `@astryxdesign/*` or `@pam/ui`, and
 * what the guard does with it: `counted` (it is in `COUNTED_COMPONENTS`, so each use is counted and its file is in
 * `INPUT_FILES`) or `not` with the reason it collects nothing. A name that is not here fails the guard: whoever
 * imports a new input-like component says which it is.
 */
export const INPUT_LIKE_IMPORTS: Readonly<Record<string, 'counted' | { readonly not: string }>> = {
  TextField: 'counted',
  SearchField: 'counted',
  SearchPill: 'counted',
  CheckboxList: 'counted',
  ChatComposerInput: 'counted',
  RadioList: 'counted',
  Switch: 'counted',
  SelectableCard: 'counted',
  Selector: 'counted',
  Dropdown: 'counted',
  DropdownMenuRadioGroup: 'counted',
  TimeInput: 'counted',
  VoiceInput: 'counted',
  CheckboxListItem: { not: 'One row of a CheckboxList; the list is counted.' },
  RadioListItem: { not: 'One row of a RadioList; the list is counted.' },
  DropdownMenuRadioItem: { not: 'One row of a DropdownMenuRadioGroup; the group is counted.' },
  DropdownMenu: { not: 'A menu of actions (open, delete, report); picking one is a tap, not an answer Pam stores.' },
  SegmentedControl: { not: 'Switches between views of the same screen (tabs); nothing is stored.' },
  SegmentedControlItem: { not: 'One tab of a SegmentedControl.' },
  InputGroup: { not: 'Lays out a field and its button side by side; the field inside is counted.' },
  InputGroupText: { not: 'A label inside an InputGroup.' },
  ChatComposer: { not: 'The frame around the message box; the box (ChatComposerInput) is counted.' },
  ChatComposerDrawer: { not: 'The drawer that holds the message box; the box (ChatComposerInput) is counted.' },
  AreaChip: { not: 'Shows the area a search uses; the words typed into the area picker are counted there (AreaPicker).' },
  LanguageSwitching: { not: 'Sets the page language and direction as the language changes; no control.' },
  TextInput: {
    not: 'Astryx\'s raw input, used only inside TextField, SearchPill and VoiceInput, each counted (the guard fails anywhere else).',
  },
};

/** The only files that may import Astryx's raw `TextInput`: each wraps it in a counted component. */
export const RAW_TEXT_INPUT_FILES: readonly string[] = [
  'packages/ui/src/TextField.tsx',
  'packages/ui/src/SearchPill.tsx',
  'packages/ui/src/VoiceInput.tsx',
];

/**
 * Every file in `apps/web/src` and `packages/ui/src` (not stories, tests or the gallery) that has a field, a file
 * picker, a signature pad, a microphone, a location request or a choice control (`COUNTED_COMPONENTS`), with how many
 * (comments removed). `collects` names what it gathers; `notPersonal` says, in one line, why nothing personal is gathered.
 */
export interface InputFile {
  readonly file: string;
  readonly fields: number;
  readonly collects?: readonly string[];
  readonly notPersonal?: string;
}

export const INPUT_FILES: readonly InputFile[] = [
  { file: 'apps/web/src/app/signin/PhoneSignInCard.tsx', fields: 1, collects: ['phone'] },
  { file: 'apps/web/src/app/join/JoinScreen.tsx', fields: 5, collects: ['first-name', 'last-name-and-city', 'waiting-list-text'] },
  { file: 'apps/web/src/screens/AddPersonView.tsx', fields: 2, collects: ['typed-for-someone-new'] },
  { file: 'apps/web/src/screens/InviteForWho.tsx', fields: 3, collects: ['typed-for-someone-new', 'email'] },
  { file: 'apps/web/src/screens/InviteExpiredScreen.tsx', fields: 1, collects: ['email'] },
  { file: 'apps/web/src/screens/ExploreScreen.tsx', fields: 1, collects: ['address-typed'] },
  { file: 'apps/web/src/app/places/AreaPicker.tsx', fields: 2, collects: ['address-typed', 'location-near'] },
  { file: 'apps/web/src/lib/imHere.ts', fields: 2, collects: ['location-here'] },
  { file: 'apps/web/src/app/messages/ThreadView.tsx', fields: 5, collects: ['messages'] },
  { file: 'apps/web/src/screens/MemberPoliciesView.tsx', fields: 2, collects: ['signature'] },
  { file: 'apps/web/src/screens/NewTripView.tsx', fields: 1, collects: ['visit-note'] },
  { file: 'apps/web/src/screens/SupportReplyScreen.tsx', fields: 1, collects: ['help-desk-reply'] },
  { file: 'apps/web/src/app/flag/page.tsx', fields: 2, collects: ['place-report'] },
  { file: 'packages/ui/src/ProfileCards.tsx', fields: 2, collects: ['staff-photo'] },
  { file: 'apps/web/src/app/join/ProgramWizard.tsx', fields: 7, collects: ['program-details'] },
  { file: 'apps/web/src/screens/ProgramView.tsx', fields: 5, collects: ['program-details'] },
  { file: 'apps/web/src/screens/ServiceEditView.tsx', fields: 9, collects: ['program-details'] },
  {
    file: 'apps/web/src/app/messages/NewMessagePicker.tsx',
    fields: 1,
    notPersonal: 'Filters the list of people already on the phone; the typed words are not sent.',
  },
  {
    file: 'apps/web/src/screens/MessagesView.tsx',
    fields: 1,
    notPersonal: 'Filters the conversations already on the phone; the typed words are not sent.',
  },
  {
    file: 'apps/web/src/screens/ScheduleView.tsx',
    fields: 1,
    notPersonal: 'Filters the visits already on the phone; the typed words are not sent.',
  },
  {
    file: 'apps/web/src/screens/PamHoursScreen.tsx',
    fields: 3,
    notPersonal: "The Pam team's opening and closing times (D-605): a setting for the whole app, nothing about a person.",
  },
  {
    file: 'apps/web/src/screens/PeopleHomeView.tsx',
    fields: 1,
    notPersonal: 'Filters the staff member\'s list already on the phone; the typed words are not sent.',
  },
  {
    file: 'apps/web/src/screens/ConnectView.tsx',
    fields: 1,
    notPersonal: 'Searches Pam\'s list of programs; the words are a request like any other (what-we-keep.p11).',
  },
  {
    file: 'apps/web/src/screens/ProgramReviewScreen.tsx',
    fields: 1,
    notPersonal: 'A note from the Pam team to a program lead about their program.',
  },
  {
    file: 'apps/web/src/screens/PoliciesView.tsx',
    fields: 2,
    notPersonal: 'A program uploads its own rules document; it is not a person\'s information.',
  },
  {
    file: 'packages/ui/src/PolicyUploadCard.tsx',
    fields: 2,
    notPersonal: 'The picker behind a program\'s rules upload (see PoliciesView).',
  },
  {
    file: 'packages/ui/src/CodeBoxes.tsx',
    fields: 1,
    notPersonal: 'The six boxes for the one-time code that was just texted (see `phone`).',
  },
  {
    file: 'packages/ui/src/BringFriend.tsx',
    fields: 1,
    notPersonal: 'Shows the link to copy and share; nothing is typed.',
  },
  { file: 'apps/web/src/app/LanguageSwitcher.tsx', fields: 1, collects: ['language'] },
  { file: 'packages/ui/src/LanguageField.tsx', fields: 1, collects: ['language'] },
  { file: 'apps/web/src/screens/AlertsView.tsx', fields: 1, collects: ['text-alerts'] },
  { file: 'apps/web/src/screens/CalendarLinkView.tsx', fields: 1, collects: ['calendar-details'] },
  { file: 'apps/web/src/screens/ServiceCards.tsx', fields: 1, collects: ['visit-service'] },
  { file: 'apps/web/src/screens/ThreadOptionsViews.tsx', fields: 1, collects: ['message-report'] },
  {
    file: 'apps/web/src/app/directory/page.tsx',
    fields: 2,
    notPersonal:
      'A filter for the list already on the phone, and the Pam team\'s switch that makes one account\'s own screens show example data ' +
      '(0057, `profiles.is_demo`). It says nothing about the person: it changes what that account sees, not what Pam knows about them.',
  },
  { file: 'apps/web/src/screens/InviteNewView.tsx', fields: 1, collects: ['staff-region'] },
  { file: 'apps/web/src/screens/RequestReviewScreen.tsx', fields: 1, collects: ['staff-region'] },
  {
    file: 'packages/ui/src/Dropdown.tsx',
    fields: 1,
    notPersonal: 'The shared dropdown; every place that uses it is counted where it is used.',
  },
];

/**
 * What each `TextField` purpose collects. Adding a purpose to `FieldPurpose` fails the guard until it is here.
 * `none` carries the reason.
 */
export const PURPOSE_COLLECTS: Readonly<Record<string, { readonly id?: string; readonly none?: string }>> = {
  phone: { id: 'phone' },
  code: { none: 'The one-time sign-in code that was just texted.' },
  inviteCode: { none: 'An invite code somebody read out or texted; it names an invite, not a person.' },
  address: { id: 'program-details' },
  name: { id: 'first-name' },
  lastName: { id: 'last-name-and-city' },
  city: { id: 'last-name-and-city' },
  email: { id: 'email' },
  theirEmail: { id: 'email' },
};

/**
 * Components that exist and collect something, but that no screen uses. The guard fails the day a screen imports
 * one, so the Privacy page is written first: the microphone button sends what a person says to the speech service
 * of their phone or browser (Apple's or Google's), which the page does not mention.
 */
export const DORMANT: readonly { readonly file: string; readonly name: string; readonly why: string }[] = [
  {
    file: 'packages/ui/src/VoiceInput.tsx',
    name: 'VoiceInput',
    why: 'A text field with a microphone (Web Speech API / the native speech plugin). No screen uses it yet.',
  },
];
