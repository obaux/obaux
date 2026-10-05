import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from '@astryxdesign/core/Button';
import { Page, PlaceCard, type PlaceCardProps } from '@pam/ui';
import { DUMMY_FLAGS, DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { useStoryText } from '../support/useStoryText';

/**
 * A place in a list (§5.1): the four facts that decide whether to go — name,
 * distance, open or shut, one sentence — and Save. The whole card is the link.
 *
 * Text args are i18n keys where the app uses one (`place.openUntil?time=17:00`),
 * so the Language toolbar changes them; a place's own name and description are
 * catalogue data and stay as written, exactly as they do in the app.
 */
function LocalisedPlaceCard({ status, distanceLabel, audienceLabel, flagLabel, labels, ...rest }: PlaceCardProps) {
  const tr = useStoryText();
  return (
    <PlaceCard
      {...rest}
      {...(distanceLabel ? { distanceLabel: tr(distanceLabel) } : {})}
      status={status ? { isOpen: status.isOpen, label: tr(status.label) } : null}
      audienceLabel={tr(audienceLabel)}
      flagLabel={tr(flagLabel)}
      labels={{ save: tr(labels.save), saved: tr(labels.saved) }}
    />
  );
}

/** The reviewer's two decisions, as `ReportedPlaces` draws them. */
function FlagActions() {
  const tr = useStoryText();
  return (
    <>
      <Button label={tr('places.reported.keep')} variant="secondary" />
      <Button label={tr('places.reported.remove')} variant="secondary" />
    </>
  );
}

/** "It is closed · 2 reports", built the way `ReportedPlaces` builds it. */
function ReportedPlaceCard(args: PlaceCardProps) {
  const tr = useStoryText();
  const reason = tr(`flag.reason.${reported.reason}`);
  const label =
    reported.count > 1 ? `${reason} · ${tr(`places.reported.count?count=${reported.count}`)}` : reason;
  return <LocalisedPlaceCard {...args} flagLabel={label} />;
}

const learning = DUMMY_PLACES_BY_ID['dummy-place-learning']!;
const food = DUMMY_PLACES_BY_ID['dummy-place-food']!;
const reported = DUMMY_FLAGS[0]!;

const meta = {
  title: 'Components/PlaceCard',
  component: PlaceCard,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedPlaceCard {...args} />,
  args: {
    name: learning.name,
    href: `/place/?id=${learning.id}&from=places`,
    description: learning.description,
    distanceLabel: 'places.miles?count=1.2',
    status: { isOpen: true, label: 'place.openUntil?time=17:00' },
    isSaved: false,
    labels: { save: 'action.save', saved: 'places.saved' },
  },
  argTypes: {
    onSave: { action: 'saved' },
    flagActions: { control: false },
  },
} satisfies Meta<typeof PlaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = {
  args: {
    name: food.name,
    description: food.description,
    distanceLabel: 'places.miles?count=0.4',
    status: { isOpen: false, label: 'place.closedUntil?time=09:00' },
  },
};

export const Saved: Story = { args: { isSaved: true } };

/** No `onSave`: signed out, so there is nothing to save to. */
export const WithoutSave: Story = { args: { onSave: undefined } };

/** PAM has no hours it will stand behind, so it says nothing — unknown is not closed. */
export const NoHoursKnown: Story = { args: { status: null } };

/** Under 0.1 miles, a GPS fix cannot tell one storefront from the next. */
export const VeryClose: Story = { args: { distanceLabel: 'places.milesUnder?count=0.1' } };

export const ForStudentsOnly: Story = {
  args: {
    name: 'Rising Sun Avenue Adult Learning Program',
    description: 'Evening reading and math classes, held in a school building in Feltonville.',
    distanceLabel: 'places.miles?count=2.6',
    audienceLabel: 'place.audience.students',
  },
};

export const ForYouth: Story = {
  args: {
    name: 'Fairhill Teen Tech Lab',
    description: 'Computers, homework help and a recording studio, after school on weekdays.',
    audienceLabel: 'place.audience.youth',
  },
};

/** Two lines, then an ellipsis — and the bookmark keeps its corner. */
export const LongName: Story = {
  args: {
    name: 'Free Library of Philadelphia — Joseph E. Coleman Northwest Regional Library, Chelten Avenue Branch',
    description:
      'Free computer classes, help with job applications and a quiet room to work. Bring an ID to get a library card, or ask at the front desk if you do not have one — staff can help you sort it out and point you to what else is in the building.',
    distanceLabel: 'places.miles?count=3.8',
    status: { isOpen: false, label: 'place.closedUntil?time=10:00' },
    audienceLabel: 'place.audience.students',
    isSaved: true,
  },
};

/** The Language toolbar set to Español: the longest version of every label. */
export const Spanish: Story = {
  ...LongName,
  globals: { locale: 'es' },
};

/** What a reviewer sees on the Reported filter (D-189). */
export const Reported: Story = {
  args: {
    name: reported.place.name,
    description: reported.place.description,
    distanceLabel: undefined,
    flagActions: <FlagActions />,
    onSave: undefined,
  },
  render: (args) => <ReportedPlaceCard {...args} />,
};
