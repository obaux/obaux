'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import {
  AppHeader,
  BellIcon,
  BigButton,
  HelpBar,
  Loading,
  NavTile,
  Notice,
  NotificationBell,
  NotificationList,
  OnboardingSlides,
  Page,
  PeopleIcon,
  PersonCard,
  PlaceCard,
  PlacesIcon,
  PlanIcon,
  PointsBadge,
  StepHeader,
  TextField,
  TextLink,
} from '@pam/ui';

/**
 * Every PAM component, in the states that matter.
 *
 * Not a demo. Two jobs:
 *
 *  1. **Change one component, see everywhere it lands.** The journeys script
 *     photographs this page alongside the real screens, so a Badge that got
 *     wider or a button that lost its focus ring shows up in the sheet next to
 *     the screens it would have broken.
 *  2. **Show the states nobody navigates to.** An empty list, a failure, a
 *     disabled button, a name with no photo. Those are most of what a person on
 *     a bad connection actually sees, and they are the hardest states to reach
 *     by clicking.
 *
 * It is deliberately not linked from the app. A member has no reason to land
 * here, and it is not a secret — it is a workbench.
 */

const styles = stylex.create({
  title: { fontSize: '28px', lineHeight: 1.2 },
  section: { fontSize: '20px', paddingBlockStart: '12px' },
  note: { fontSize: '15px' },
  row: { width: '100%' },
  card: { width: '100%' },
});

const PLACE_LABELS = {
  call: 'Call',
  go: 'Go',
  save: 'Save',
  saved: 'Saved',
  hours: 'Hours',
  more: 'More about this place',
  share: 'Share this place',
  flag: 'Something is wrong here',
};

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <VStack gap={2}>
      <Heading level={2} xstyle={styles.section}>
        {title}
      </Heading>
      {note ? (
        <Text type="supporting" xstyle={styles.note}>
          {note}
        </Text>
      ) : null}
      {children}
    </VStack>
  );
}

export default function GalleryPage() {
  return (
    <Page width="read" gap={4}>
      <AppHeader roleLabel="Case manager" />
      <Heading level={1} xstyle={styles.title}>
        Components
      </Heading>
      <Text type="supporting" xstyle={styles.note}>
        Every piece PAM is built from, including the states you cannot click your
        way to. Change one here and it changes on every screen.
      </Text>

      <Section title="Header" note="The mark, and who you are signed in as.">
        <VStack gap={2}>
          <AppHeader />
          <AppHeader roleLabel="Member" />
          <AppHeader roleLabel="Program manager" />
          <AppHeader roleLabel="Super admin" />
          <AppHeader align="center" />
          <AppHeader align="center" isSticky />
        </VStack>
      </Section>

      <Section
        title="What PAM is"
        note="Three slides, one idea each, above the sign-in card. Swipe them."
      >
        <OnboardingSlides
          label="How PAM works"
          slides={[
            {
              id: 'places',
              image: '/onboarding/places.svg',
              text: 'Find places near you that can help — food, work, school, a doctor.',
            },
            {
              id: 'people',
              image: '/onboarding/people.svg',
              text: 'A real person can point you to the right one and answer questions.',
            },
            {
              id: 'plan',
              image: '/onboarding/plan.svg',
              text: 'PAM reminds you before you go, so nothing gets missed.',
            },
          ]}
        />
      </Section>

      <Section title="Somewhere to go" note="The home screen is a menu. The whole tile is the target.">
        <VStack gap={2}>
          <NavTile
            href="#"
            icon={<PlacesIcon />}
            label="Places"
            description="Food, work, school and health near you."
          />
          <NavTile
            href="#"
            icon={<BellIcon />}
            label="Notifications"
            description="What has happened and needs you."
            alertLabel="2 new"
          />
        </VStack>
      </Section>

      <Section title="Primary action" note="64px tall. One per screen (§2.5).">
        <VStack gap={2}>
          <BigButton label="Send me a code" onPress={() => {}} />
          <BigButton label="Waiting…" onPress={() => {}} isDisabled />
          <BigButton label="As a link" href="#" />
        </VStack>
      </Section>

      <Section title="Ways on" note="Never the main action, always 48px to hit.">
        <HStack gap={2} wrap="wrap">
          <TextLink label="Get help" href="#" />
          <TextLink label="Back" href="#" />
          <TextLink label="Privacy" href="#" size="quiet" />
          <TextLink label="Disabled" isDisabled />
        </HStack>
      </Section>

      <Section title="Fields" note="56px frame, and a keyboard that matches the job.">
        <VStack gap={3}>
          <TextField label="Your phone number" purpose="phone" value="" onChange={() => {}} width="100%" />
          <TextField label="The code we texted you" purpose="code" value="123456" onChange={() => {}} width="100%" />
        </VStack>
      </Section>

      <Section title="A place" note="Three actions, always the same three, always in this order (§5.1).">
        <VStack gap={3}>
          <PlaceCard
            name="Riverside Learning Center"
            category="education"
            categoryLabel="School and training"
            phone="+12155550100"
            address="1234 Market St, Philadelphia"
            distanceLabel="1.2 miles"
            onShare={() => {}}
            flagHref="/flag/"
            labels={PLACE_LABELS}
          />
          <PlaceCard
            name="A place whose name is long enough to need the two-line clamp, so the menu keeps its corner"
            category="family_services"
            categoryLabel="Home and family"
            address="900 Spring Garden St"
            onShare={() => {}}
            flagHref="/flag/"
            labels={PLACE_LABELS}
          />
          <PlaceCard
            name="A place with no phone and no distance"
            category="workforce"
            categoryLabel="Work and money"
            address="500 Broad St"
            labels={PLACE_LABELS}
          />
        </VStack>
      </Section>

      <Section title="A person">
        <VStack gap={3}>
          <PersonCard
            firstName="Nia"
            roleLine="I went back to school at 40. Ask me anything."
            sharedTags={['Same neighbourhood', 'Parent']}
            messageLabel="Message"
            onMessage={() => {}}
          />
          <PersonCard
            firstName="Alice"
            orgBadgeLabel="Verified program"
            messageLabel="Message"
            onMessage={() => {}}
          />
        </VStack>
      </Section>

      <Section
        title="Waiting"
        note="What every screen shows while it works out who is signed in. The screen variant centres in the window; this one is drawn inline so the page below it stays readable."
      >
        <Loading label="Loading" variant="inline" />
      </Section>

      <Section title="Points and steps">
        <VStack gap={3}>
          <PointsBadge points={250} label="points" />
          <StepHeader current={2} total={5} title="Where do you want help?" progressLabel="Step 2 of 5" />
        </VStack>
      </Section>

      <Section title="Notifications" note="A bell with a count, and the list behind it.">
        <VStack gap={3}>
          <HStack gap={3} align="center" wrap="wrap">
            <NotificationBell href="#" label="Notifications" unreadCount={0} unreadLabel="0 new" />
            <NotificationBell href="#" label="Notifications" unreadCount={2} unreadLabel="2 new" />
          </HStack>
          <Card padding={3} xstyle={styles.card}>
            <NotificationList
              items={[
                { id: 'a', text: 'Someone reported a place: closed', when: 'Today', isRead: false },
                { id: 'b', text: 'Someone said a message is not safe', when: 'Yesterday', isRead: true },
              ]}
              labels={{ empty: 'Nothing needs you right now.', markRead: 'Mark as read' }}
            />
          </Card>
          <Card padding={3} xstyle={styles.card}>
            <NotificationList
              items={[]}
              labels={{ empty: 'Nothing needs you right now.', markRead: 'Mark as read' }}
            />
          </Card>
        </VStack>
      </Section>

      <Section
        title="When something is wrong"
        note="Plain language, never blame, always a way to a person (§0)."
      >
        <VStack gap={3}>
          <Notice
            notice="offline"
            title="You are not connected"
            body="PAM needs the internet for this. Try again when you have signal."
            supportPhone="+12673095265"
            callLabel="Call PAM for help"
          />
          <Notice
            notice="something_went_wrong"
            title="Something went wrong"
            body="This is not your fault. Try again, or call PAM and we will help."
            supportPhone="+12673095265"
            callLabel="Call PAM for help"
          />
        </VStack>
      </Section>

      <Section title="Help">
        <VStack gap={2}>
          <HelpBar label="Get help" href="#" variant="block" />
          <HelpBar label="Help" href="#" />
        </VStack>
      </Section>
    </Page>
  );
}
