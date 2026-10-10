import type { Meta, StoryObj } from '@storybook/nextjs';
import {
  BigButton,
  GlobeIcon,
  Page,
  PageTitle,
  PhoneIcon,
  PlacesIcon,
  appleMapsHref,
  directionsHref,
  googlePlaceHref,
} from '@pam/ui';
import { PlaceDetail, type PlaceDetailProps } from '@pam/ui/PlaceDetail';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { categoryLabelKey } from '@pam/config';
import type { PlaceHours } from '@pam/config/hours';
import { useI18n } from '@/lib/i18n';
import { weekLines } from '@/lib/usePlaceStatus';
import { useStoryText } from '../support/useStoryText';

/**
 * One place, on its own screen — the profile (D-440): what it is and who it is
 * for, a short list of ways to reach it (directions, call, website), the
 * address with its copy button and "Open in…", the week, and **getting there**
 * as the one primary button, pinned to the foot of the screen.
 *
 * The old layout of labelled rows with save, share and report in the page is
 * gone. Save and report live in the bar above the title, as on the real screen.
 *
 * Wired the way `/place/` wires it: the category label, the labels and the week
 * all come from i18n, so the Language toolbar changes everything but the
 * catalogue's own words. The name is passed to `PageTitle` above it, as on the
 * real screen.
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

/** What a story passes for the sticky footer: the button's label key and where it goes. */
type FooterArgs = { footerLabel?: string; footerHref?: string | null };

/** The component's props plus what the screen around it needs. */
type StoryArgs = DetailArgs & FooterArgs;

const QUICK = { width: 26, height: 26, 'aria-hidden': true } as const;

function LocalisedPlaceDetail({
  status,
  audienceLabel,
  labels,
  addressActions,
  quickActionsLabel,
  quickActions,
  ...rest
}: DetailArgs) {
  const tr = useStoryText();
  return (
    <PlaceDetail
      {...rest}
      quickActionsLabel={tr(quickActionsLabel) ?? undefined}
      quickActions={quickActions?.map((action) => ({
        ...action,
        label: tr(action.label),
        description: tr(action.description) ?? undefined,
      }))}
      addressActions={
        addressActions
          ? {
              googleMapsHref: addressActions.googleMapsHref ?? null,
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
      placeholderNote={tr(rest.placeholderNote ?? 'place.hours.sample')}
      labels={Object.fromEntries(
        Object.entries(labels).map(([name, key]) => [name, tr(key)]),
      ) as DetailArgs['labels']}
    />
  );
}

/** The footer of a place screen: its one action, sticky, as `Page footer` draws it. */
function PlaceFooter({ footerLabel, footerHref }: FooterArgs) {
  const { t } = useI18n();
  return footerHref ? <BigButton label={t(footerLabel ?? 'place.directions')} href={footerHref} /> : null;
}

/** The real screen: a title with the way back, the detail, and the sticky footer button. */
function PlaceScreen({
  title,
  hours,
  footerLabel,
  footerHref,
  ...args
}: DetailArgs & FooterArgs & { title: string; hours: PlaceHours }) {
  const { t, locale } = useI18n();
  return (
    <Page gap={4} footer={<PlaceFooter footerLabel={footerLabel} footerHref={footerHref} />}>
      <PageTitle title={title} backHref="/places/" backLabel={t('nav.back.places')} />
      <LocalisedPlaceDetail
        {...args}
        weekLines={weekLines(hours, locale, t('place.hours.closed'))}
        hoursArePlaceholder={!hours.isReal}
      />
    </Page>
  );
}

const learning = DUMMY_PLACES_BY_ID['dummy-place-learning']!;
const workforce = DUMMY_PLACES_BY_ID['dummy-place-workforce']!;

const LABELS: DetailArgs['labels'] = {
  hours: 'place.hours',
  hoursOnGoogle: 'place.hoursOnGoogle',
  about: 'place.about',
  address: 'place.address',
};

const learningDirections = directionsHref(learning.address, learning.lat, learning.lon) ?? null;

/** The list under the name, most important first (D-291): getting there, calling, the website. */
const QUICK_ACTIONS: NonNullable<DetailArgs['quickActions']> = [
  {
    id: 'directions',
    label: 'place.quick.directions',
    description: 'place.quick.directions.body',
    icon: <PlacesIcon {...QUICK} />,
    href: learningDirections ?? '#',
    isExternal: true,
  },
  {
    id: 'call',
    label: 'place.quick.call',
    description: learning.phone ?? undefined,
    icon: <PhoneIcon {...QUICK} />,
    href: `tel:${learning.phone ?? ''}`,
  },
  {
    id: 'website',
    label: 'place.quick.website',
    description: 'example.org',
    icon: <GlobeIcon {...QUICK} />,
    href: 'https://example.org',
    isExternal: true,
  },
];

const meta = {
  title: 'Components/Places/PlaceDetail',
  tags: ['autodocs'],
  component: PlaceDetail,
  render: (args) => <PlaceScreen {...args} title={learning.name} hours={WEEKDAY_OFFICE} />,
  args: {
    category: learning.category,
    categoryLabel: categoryLabelKey(learning.category),
    description: learning.description,
    address: learning.address,
    status: { isOpen: true, label: 'place.openUntil?time=17:00' },
    quickActionsLabel: 'place.quick.label',
    quickActions: QUICK_ACTIONS,
    // The sticky footer's one button (Will, 10 October 2026, D-440). Not a
    // PlaceDetail prop: the page owns its footer, so the story passes these two
    // to the screen it draws around the component.
    footerLabel: 'place.directions',
    footerHref: learningDirections,
    // Copy the address, or "Open in…" Google Maps or Apple Maps (Will, 9 October
    // 2026). Labels are i18n keys, said by the story.
    addressActions: {
      googleMapsHref: learningDirections,
      appleMapsHref: appleMapsHref(learning.address, learning.lat, learning.lon) ?? null,
      labels: {
        copy: 'place.address.copy',
        copied: 'place.address.copied',
        copyFailed: 'place.address.copyFailed',
        openIn: 'place.address.openIn',
        openInTitle: 'place.address.openInTitle',
        googleMaps: 'place.address.app.google',
        appleMaps: 'place.address.app.apple',
        opensInApp: 'place.address.opensInApp',
      },
    },
    hoursHref: googlePlaceHref(learning.name, learning.address),
    labels: LABELS,
  },
  argTypes: {
    category: { control: 'inline-radio', options: ['education', 'workforce', 'family_services'] },
  },
} satisfies Meta<StoryArgs>;

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

/** No website: the row simply is not there, rather than drawn dead. */
export const Sparse: Story = {
  args: {
    category: workforce.category,
    categoryLabel: categoryLabelKey(workforce.category),
    description: workforce.description,
    address: workforce.address,
    quickActions: QUICK_ACTIONS.filter((action) => action.id !== 'website'),
    status: null,
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
    footerHref: directionsHref('68 W Chelten Ave, Philadelphia, PA 19144') ?? null,
    hoursHref: googlePlaceHref(LONG_NAME, '68 W Chelten Ave, Philadelphia, PA 19144'),
    audienceLabel: 'place.audience.youth',
  },
  render: (args) => <PlaceScreen {...args} title={LONG_NAME} hours={WEEKDAY_OFFICE} />,
};

export const Spanish: Story = { ...LongName, globals: { locale: 'es' } };

/**
 * An English street address inside an Arabic screen (D-439). The address
 * keeps its own order — number first — instead of being reordered by the
 * right-to-left page, and the copy button and Apple Maps link sit beside it.
 */
export const ArabicAddress: Story = { globals: { locale: 'ar' } };
