import type { Meta, StoryObj } from '@storybook/nextjs';
import { VStack } from '@astryxdesign/core/VStack';
import { CardEnter, NavTile, Page, PlaceCard, PlacesIcon, Press, ScrollReveal } from '@pam/ui';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { useStoryText } from '../support/useStoryText';

/**
 * Pam's motion: cards arriving in turn (40ms a row, capped at six), lists
 * revealing as they scroll in, and a press that gives under the thumb. All of
 * it lives in a runtime `MotionProvider` loads only on a connection that can
 * afford it, and none of it plays under reduced motion — so with motion
 * reduced, or on 2G, these stories are deliberately still.
 *
 * Change the `run` control to play an entrance again.
 */
const PLACES = [
  ...Object.values(DUMMY_PLACES_BY_ID),
  ...Object.values(DUMMY_PLACES_BY_ID),
];

function Cards({ mode }: { readonly mode: 'enter' | 'reveal' }) {
  const tr = useStoryText();
  const Wrap = mode === 'enter' ? CardEnter : ScrollReveal;
  return (
    <VStack gap={3}>
      {PLACES.map((place, index) => (
        <Wrap key={`${place.id}-${index}`} index={index}>
          <PlaceCard
            name={place.name}
            href={`/place/?id=${place.id}`}
            description={place.description}
            distanceLabel={tr(`places.miles?count=${(index + 1) * 0.4}`)}
            labels={{ save: tr('action.save'), saved: tr('places.saved') }}
          />
        </Wrap>
      ))}
    </VStack>
  );
}

function MotionDemo({ demo, run }: { readonly demo: 'cardEnter' | 'scrollReveal' | 'press'; readonly run: number }) {
  const tr = useStoryText();
  if (demo === 'press') {
    return (
      <Press>
        <NavTile href="/places/" icon={<PlacesIcon />} label={tr('places.title')} description={tr('home.go.places')} />
      </Press>
    );
  }
  return <Cards key={run} mode={demo === 'cardEnter' ? 'enter' : 'reveal'} />;
}

const meta = {
  title: 'Components/Motion',
  component: MotionDemo,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  args: { demo: 'cardEnter', run: 1 },
  argTypes: {
    demo: { control: 'inline-radio', options: ['cardEnter', 'scrollReveal', 'press'] },
    run: { control: { type: 'number', min: 1 } },
  },
} satisfies Meta<typeof MotionDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A list arriving: each card in its turn. */
export const CardEntrance: Story = {};

/** A long list: rows fade up as they scroll into view. */
export const ScrollRevealList: Story = { args: { demo: 'scrollReveal' } };

/** Hold the tile down: it gives a little under the thumb. */
export const PressFeedback: Story = { args: { demo: 'press' } };
