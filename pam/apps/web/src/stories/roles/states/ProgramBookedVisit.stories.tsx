import type { Meta, StoryObj } from '@storybook/nextjs';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { NotificationList, Page, TripsIcon } from '@pam/ui';
import { CategoryArt } from '@pam/ui/CategoryArt';
import { NextTripCard } from '@pam/ui/NextTripCard';
import { TripCard } from '@pam/ui/TripCard';
import { NewTripButton, TripsView } from '../../../screens/TripsView';
import { intlLocale } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { whenHappened } from '@/lib/when';

/**
 * A program booked a visit for the member (D-595, a94): the words "Booked for you" (no program: the card's title already names the place, Will, 15:21) on the member's Trips and on
 * Explore's next-visit card, the bell row, and "Booked by {program}" on a case manager's view of the member's trips. They are here so the
 * language fit audit measures every one, in every language.
 */
const meta = {
  title: 'Member/Created/States/Program booked a visit',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const PLACE = 'Free Library of Philadelphia — Joseph E. Coleman Northwest Regional Library';
const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** The member's Trips: the card says who booked it. */
export const OnTrips: Story = {
  render: () => (
    <TripsView
      trips={[
        { id: 't1', placeId: 'p1', placeName: PLACE, category: 'education', lat: 39.95, lon: -75.16, startsAt: inDays(3), bookedByProgram: true },
        { id: 't2', placeId: 'p2', placeName: 'Example Workforce Center', category: 'workforce', lat: 39.96, lon: -75.17, startsAt: inDays(5) },
      ]}
      headerActions={<NewTripButton />}
    />
  ),
};

function Cards() {
  const { t, locale } = useI18n();
  const when = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(inDays(3)));
  return (
    <Page gap={4}>
      <NextTripCard
        categoryLabel={t('category.education')}
        categoryIcon={<TripsIcon />}
        art={<CategoryArt category="education" size="fill" />}
        title={t('explore.nextTrip.title')}
        when={when}
        href="/trips/"
        mark={t('trips.bookedForYou')}
        label={PLACE}
      />
      <VStack gap={2}>
        <TripCard
          placeName={PLACE}
          when={when}
          href="/place/?id=p1"
          art={<CategoryArt category="education" size="fill" />}
          mark={t('person.trip.bookedBy', { program: PLACE })}
          label={PLACE}
        />
      </VStack>
      <Card padding={3}>
        <NotificationList
          items={[
            {
              id: 'n1',
              text: t('notify.visit_booked_for_you', { place: PLACE, when }),
              title: t('notify.kind.visit_booked_for_you'),
              icon: <TripsIcon />,
              when: whenHappened(inDays(0), locale, t),
              isNew: true,
              href: '/trips/',
            },
          ]}
          labels={{ empty: t('notify.none'), new: t('notify.new') }}
        />
      </Card>
    </Page>
  );
}

/** Explore's next-visit card, a case manager's trip card and the bell row, each with the program's long name. */
export const NextVisitCaseManagerAndBell: Story = { render: () => <Cards /> };
