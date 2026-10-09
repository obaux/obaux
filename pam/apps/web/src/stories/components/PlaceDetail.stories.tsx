import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page, PageTitle, appleMapsHref, directionsHref, googlePlaceHref } from '@pam/ui';
import { PlaceDetail, type PlaceDetailProps } from '@pam/ui/PlaceDetail';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { categoryLabelKey } from '@pam/config';
import type { PlaceHours } from '@pam/config/hours';
import { useI18n } from '@/lib/i18n';
import { weekLines } from '@/lib/usePlaceStatus';
import { useStoryText } from '../support/useStoryText';

/**
 * One place, on its own screen: what it is and who it is for, then **getting
 * there** — the one primary action — then the things you check before setting
 * off, then share and report as labelled rows.
 *
 * Wired the way `/place/` wires it: the category label, the labels and the week
 * all come from i18n, so the Language toolbar changes everything but the
 * catalogue's own words. The name is passed to `PageTitle` above it, as on the
 * real screen; the `WithOwnHeading` story shows the component's own heading.
 */
const NINE_TO_FIVE = [{ open: '09:00', close: '17:00' }];
const LATE = [{ open: '09:00', close: '20:00' }];
const WEEKDAY_OFFICE: PlaceHours = {
  isReal: false,
  week: [[], NINE_TO_FIVE, NINE_TO_FIVE, NINE_TO_FIVE, NINE_TO_FIVE, NINE_TO_FIVE, []],
};
const OPEN_LATE: PlaceHours = {
  isReal: true,
  week: [[], LATE, LATE, LATE, LATE, NINE_TO_FIVE, [{ open: '10:00', close: '14:00' }]],
};

type DetailArgs = PlaceDetailProps;

function LocalisedPlaceDetail({ status, audienceLabel, labels, addressActions, ...rest }: DetailArgs) {
  const tr = useStoryText();
  return (
    <PlaceDetail
      {...rest}
      addressActions={
        addressActions
          ? {
              appleMapsHref: addressActions.appleMapsHref ?? null,
              labels: Object.fromEntries(
                Object.entries(addressActions.labels).map(([name, key]) => [name, tr(key)]),
              ) as NonNullable<DetailArgs['addressActions']>['labels'],
            }
          : undefined
      }
      categoryLabel={tr(rest.categoryLabel)}
      status={status ? { isOpen: status.isOpen, label: tr(status.label) } : null}
      audienceLabel={tr(audienceLabel)}
      distanceLabel={tr(rest.distanceLabel)}
      placeholderNote={tr(rest.placeholderNote ?? 'place.hours.sample')}
      labels={Object.fromEntries(
        Object.entries(labels).map(([name, key]) => [name, tr(key)]),
      ) as DetailArgs['labels']}
    />
  );
}

/** The real screen: a title with the way back, then the detail. */
function PlaceScreen({ title, hours, ...args }: DetailArgs & { title: string; hours: PlaceHours }) {
  const { t, locale } = useI18n();
  return (
    <>
      <PageTitle title={title} backHref="/places/" backLabel={t('nav.back.places')} />
      <LocalisedPlaceDetail
        {...args}
        weekLines={weekLines(hours, locale, t('place.hours.closed'))}
        hoursArePlaceholder={!hours.isReal}
      />
    </>
  );
}

const learning = DUMMY_PLACES_BY_ID['dummy-place-learning']!;
const workforce = DUMMY_PLACES_BY_ID['dummy-place-workforce']!;

const LABELS: DetailArgs['labels'] = {
  directions: 'place.directions',
  call: 'place.call',
  website: 'place.website',
  hours: 'place.hours',
  hoursOnGoogle: 'place.hoursOnGoogle',
  about: 'place.about',
  address: 'place.address',
  save: 'place.save',
  saved: 'places.saved',
  share: 'place.share',
  flag: 'place.flag',
};

const meta = {
  title: 'Components/Places/PlaceDetail',
  tags: ['autodocs'],
  component: PlaceDetail,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <PlaceScreen {...args} title={learning.name} hours={WEEKDAY_OFFICE} />,
  args: {
    category: learning.category,
    categoryLabel: categoryLabelKey(learning.category),
    description: learning.description,
    address: learning.address,
    distanceLabel: null,
    status: { isOpen: true, label: 'place.openUntil?time=17:00' },
    phone: learning.phone,
    website: 'https://example.org',
    directionsHref: directionsHref(learning.address, learning.lat, learning.lon) ?? null,
    // Copy the address, or open it in Apple Maps (Will, 9 October 2026); Google
    // Maps is the button above. Labels are i18n keys, said by the story.
    addressActions: {
      appleMapsHref: appleMapsHref(learning.address, learning.lat, learning.lon) ?? null,
      labels: {
        copy: 'place.address.copy',
        copied: 'place.address.copied',
        copyFailed: 'place.address.copyFailed',
        appleMaps: 'place.address.appleMaps',
      },
    },
    hoursHref: googlePlaceHref(learning.name, learning.address),
    isSaved: false,
    onSave: () => {},
    onShare: () => {},
    flagHref: `/flag/?place=${learning.id}`,
    labels: LABELS,
  },
  argTypes: {
    category: { control: 'inline-radio', options: ['education', 'workforce', 'family_services'] },
    onSave: { action: 'saved' },
    onShare: { action: 'shared' },
    onCall: { action: 'called' },
  },
} satisfies Meta<typeof PlaceDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sample hours, said out loud under the week so a demo never reads as a promise. */
export const Default: Story = {};

/** Real hours from the catalogue: no note under the week. */
export const RealHours: Story = {
  args: { status: { isOpen: true, label: 'place.openUntil?time=20:00' } },
  render: (args) => <PlaceScreen {...args} title={learning.name} hours={OPEN_LATE} />,
};

export const Closed: Story = {
  args: { status: { isOpen: false, label: 'place.closedUntil?time=09:00' } },
};

export const Saved: Story = { args: { isSaved: true } };

/** No phone, no website: the rows simply are not there, rather than drawn dead. */
export const Sparse: Story = {
  args: {
    category: workforce.category,
    categoryLabel: categoryLabelKey(workforce.category),
    description: workforce.description,
    address: workforce.address,
    phone: workforce.phone,
    website: null,
    status: null,
    onSave: undefined,
  },
  render: (args) => <PlaceScreen {...args} title={workforce.name} hours={{ isReal: true, week: [] }} />,
};

export const ForStudentsOnly: Story = {
  args: {
    audienceLabel: 'place.audience.students',
    description: 'Evening reading and math classes, held in a school building in Feltonville.',
    address: '4900 Rising Sun Ave, Philadelphia, PA 19120',
  },
  render: (args) => (
    <PlaceScreen {...args} title="Rising Sun Avenue Adult Learning Program" hours={WEEKDAY_OFFICE} />
  ),
};

const LONG_NAME = 'Free Library of Philadelphia — Joseph E. Coleman Northwest Regional Library';

export const LongName: Story = {
  args: {
    category: 'education',
    categoryLabel: categoryLabelKey('education'),
    description:
      'Free computer classes, help with job applications and a quiet room to work. Bring an ID to get a library card, or ask at the front desk if you do not have one — staff can help you sort it out and point you to what else is in the building, including the career corner on the second floor.',
    address: '68 W Chelten Ave, Philadelphia, PA 19144',
    directionsHref: directionsHref('68 W Chelten Ave, Philadelphia, PA 19144') ?? null,
    hoursHref: googlePlaceHref(LONG_NAME, '68 W Chelten Ave, Philadelphia, PA 19144'),
    audienceLabel: 'place.audience.youth',
  },
  render: (args) => <PlaceScreen {...args} title={LONG_NAME} hours={WEEKDAY_OFFICE} />,
};

export const Spanish: Story = { ...LongName, globals: { locale: 'es' } };

/**
 * An English street address inside an Arabic screen (D-435). The address
 * keeps its own order — number first — instead of being reordered by the
 * right-to-left page, and the copy button and Apple Maps link sit beside it.
 */
export const ArabicAddress: Story = { globals: { locale: 'ar' } };

/** Without `PageTitle` above it, the component draws the name itself. */
export const WithOwnHeading: Story = {
  args: { name: learning.name, distanceLabel: 'places.miles?count=1.2' },
  render: (args) => <LocalisedPlaceDetail {...args} />,
};
