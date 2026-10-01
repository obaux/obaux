import type { Meta, StoryObj } from '@storybook/nextjs';
import type { JourneyRole } from '../journeys/fixtures';
import { asRole } from '../journeys/journey';
import { PrototypeApp, prototypeRouter } from './PrototypeApp';
import { REDESIGN_ROUTES, TODAY_ROUTES, redesignChrome } from './routes';

/**
 * The app, clickable (D-211). Tap anything — a card, a tab, Back, Help — and
 * the screen it leads to appears, as in the app. Each story is one person
 * signed in against the pretend database; nothing reaches the live project.
 */
const meta = {
  title: 'Prototype',
  component: PrototypeApp,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PrototypeApp>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Signed in as `role`, with `useRouter()` driving the prototype instead of the iframe. */
function prototype(role: JourneyRole, start: string): Pick<Story, 'loaders' | 'parameters'> {
  return {
    loaders: asRole(role, start).loaders as Story['loaders'],
    parameters: {
      nextjs: { appDirectory: true, navigation: { pathname: start, ...prototypeRouter } },
    },
  };
}

export const RedesignMember: Story = {
  ...prototype('member', '/'),
  name: 'Redesign — member',
  args: { routes: REDESIGN_ROUTES, start: '/', chrome: redesignChrome('member') },
};

export const RedesignCaseManager: Story = {
  ...prototype('case-manager', '/'),
  name: 'Redesign — case manager',
  args: { routes: REDESIGN_ROUTES, start: '/', chrome: redesignChrome('case-manager') },
};

export const RedesignProgram: Story = {
  ...prototype('provider', '/'),
  name: 'Redesign — program',
  args: { routes: REDESIGN_ROUTES, start: '/', chrome: redesignChrome('provider') },
};

export const TodayMember: Story = {
  ...prototype('member', '/'),
  name: 'Today — member',
  args: { routes: TODAY_ROUTES, start: '/' },
};

export const TodayCaseManager: Story = {
  ...prototype('case-manager', '/'),
  name: 'Today — case manager',
  args: { routes: TODAY_ROUTES, start: '/' },
};

export const TodayProgram: Story = {
  ...prototype('provider', '/'),
  name: 'Today — program',
  args: { routes: TODAY_ROUTES, start: '/' },
};

export const TodaySuperAdmin: Story = {
  ...prototype('super-admin', '/'),
  name: 'Today — super admin',
  args: { routes: TODAY_ROUTES, start: '/' },
};

export const TodaySignedOut: Story = {
  ...prototype('signed-out', '/signin/'),
  name: 'Today — not signed in',
  args: { routes: TODAY_ROUTES, start: '/signin/' },
};
