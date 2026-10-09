import type { Meta, StoryObj } from '@storybook/nextjs';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, ShareIcon } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { roundAction } from '@pam/ui/roundAction';
import { SetupArt } from '@pam/ui/SetupArt';

/**
 * Every nested screen — one you reach by tapping into something: a round back
 * button that says where it goes, then the screen's name, large, then its
 * content. The name moves into the sticky bar as the page scrolls. A
 * conversation uses it too, its ⋯ in the bar (D-411 — there was a compact
 * form until then); `footer` pins one action to the bottom of the screen with
 * a fade above it.
 */
const meta = {
  title: 'Components/Navigation/SubPage',
  tags: ['autodocs'],
  component: SubPage,
  args: {
    title: 'Get help',
    backHref: '/profile/',
    backLabel: 'Back to Profile',
    gap: 4,
    children: (
      <VStack gap={3}>
        <Text>Talk to someone at Pam about anything — a ride, a program, or getting set up.</Text>
        <Text type="supporting">We answer weekdays from 9 AM to 5 PM. Call (555) 555-0123.</Text>
        <Text type="supporting">If it is after hours, leave a message and we will call you back the next morning.</Text>
      </VStack>
    ),
  },
  argTypes: {
    gap: { control: 'inline-radio', options: [2, 3, 4] },
    children: { control: false },
    footer: { control: false },
    actions: { control: false },
    titleAddon: { control: false },
    onBack: { action: 'back' },
  },
} satisfies Meta<typeof SubPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A line under the large title. */
export const WithSubtitle: Story = {
  args: {
    title: 'Example Learning Center',
    subtitle: 'Free classes for a high school diploma',
    backHref: '/',
    backLabel: 'Back to Home',
    actions: (
      <IconButton
        label="Share"
        variant="ghost"
        icon={
          <HStack>
            <ShareIcon width={24} height={24} aria-hidden />
          </HStack>
        }
      />
    ),
  },
};

/**
 * A conversation's header (D-411): back and ⋯ where they are on every nested
 * screen, the name large, who they are on one line under it (D-400).
 */
export const Conversation: Story = {
  args: {
    title: 'Renee',
    backHref: '/messages/',
    backLabel: 'Back to Messages',
    subtitle: 'Program lead at Example Food Pantry of North Philadelphia',
    hasOneLineSubtitle: true,
    actions: (
      <IconButton
        label="More"
        href="/messages/thread/options/"
        variant="ghost"
        icon={<Icon icon="moreHorizontal" size="md" />}
        xstyle={roundAction.button}
      />
    ),
    children: (
      <VStack gap={3}>
        <Text>Hi Renee, can I come by on Thursday?</Text>
        <Text type="supporting">Yes — the pantry is open 10 to 2. Ask for me at the front.</Text>
      </VStack>
    ),
  },
};

/** One action pinned to the bottom of the screen, with a fade above it. */
export const WithFooter: Story = {
  args: {
    title: 'Example Learning Center',
    subtitle: 'Tuesday and Thursday, 9 AM to noon',
    backHref: '/',
    backLabel: 'Back to Home',
    footer: <BigButton label="Plan a trip here" href="/trips/new/" />,
  },
};

/** Back as a step, not a link — a multi-step screen going to its previous step. */
export const BackAsAStep: Story = {
  args: {
    title: 'When do you want to go?',
    backHref: undefined,
    backLabel: 'Back to the previous step',
    onBack: () => undefined,
  },
};

/**
 * The hero template (D-376): a 240px picture, full width and up to the top
 * edge, back over it (no Help — the hero is an exception, A19), the title under
 * it, the choice pinned
 * to the bottom. For pages that should feel like a moment — adding your
 * program to your account — not for everyday screens.
 */
export const Hero: Story = {
  args: {
    title: 'Add your program to your account',
    hero: <SetupArt kind="switch" isHero />,
    footer: <BigButton label="Add my program" />,
  },
};
