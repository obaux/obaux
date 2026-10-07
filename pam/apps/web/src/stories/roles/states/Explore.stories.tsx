import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { PlaceCard } from '@pam/ui';
import { SearchPill } from '@pam/ui/SearchPill';
import { ExploreView } from '../../../screens/ExploreView';
import { ExploreScreen } from '../../../screens/ExploreScreen';
import type { Category } from '@pam/config';
import type { NearbyPlace } from '../../../lib/usePlaces';
import { HeaderActions } from '../../shell/HeaderActions';
import { asRedesign } from '../../journeys/journey';
import { PLACES } from '../../journeys/fixtures';

/**
 * Explore, the member's home (D-212). `Live` is the screen wired to the
 * pretend database — type, pick a chip, tap a card. The others hold one
 * state still, so each can be looked at: loading, can't connect, nothing
 * matches, an empty category.
 */
const places = PLACES.map(
  (place, i): NearbyPlace => ({
    id: place.id,
    name: place.name,
    lookupName: null,
    category: place.category as Category,
    address: place.address,
    phone: null,
    placeId: null,
    lat: null,
    lon: null,
    meters: 400 + i * 900,
    hasHours: false,
    hours: null,
    description: place.description_plain,
    website: null,
    audience: null,
  }),
);

const pill = (
  <SearchPill
    label="Search programs by name or address"
    placeholder="Search programs"
    searchSource={{ search: () => [], bootstrap: () => [] }}
    onPick={() => {}}
    onQuery={() => {}}
    emptyText="No program by that name or address"
    clearLabel="Clear search"
  />
);

const meta = {
  title: 'Member/Created/States/Explore',
  component: ExploreView,
  args: {
    search: pill,
    actions: <HeaderActions />,
    category: 'all',
    onCategory: fn(),
    query: '',
    state: { status: 'ready', places },
    renderPlace: (place) => (
      <PlaceCard
        key={place.id}
        name={place.name}
        href={`/place/?id=${place.id}&from=explore`}
        description={place.description}
        isSaved={false}
        onSave={() => {}}
        labels={{ save: 'Save', saved: 'Saved' }}
      />
    ),
    onRetry: fn(),
    onClearSearch: fn(),
    supportPhone: '+12673095265',
  },
} satisfies Meta<typeof ExploreView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = { ...asRedesign('member', '/'), name: 'Live (type, tap, filter)', render: () => <ExploreScreen /> };
export const Places: Story = { ...asRedesign('member', '/') };
export const Loading: Story = { ...asRedesign('member', '/'), args: { state: { status: 'loading' } } };
export const CantConnect: Story = {
  ...asRedesign('member', '/'),
  name: "Can't connect",
  args: { state: { status: 'error', offline: true } },
};
export const SomethingWentWrong: Story = {
  ...asRedesign('member', '/'),
  args: { state: { status: 'error', offline: false } },
};
export const NothingMatches: Story = {
  ...asRedesign('member', '/'),
  args: { query: 'zzz', state: { status: 'empty' } },
};
export const EmptyCategory: Story = {
  ...asRedesign('member', '/'),
  args: { category: 'workforce', state: { status: 'empty' } },
};
export const Spanish: Story = { ...Live, name: 'Live — Spanish', globals: { locale: 'es' } };
