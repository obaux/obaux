import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { Page, SavedStrip, type SavedStripPlace, type SavedStripProps } from '@pam/ui';
import { categoryLabelKey } from '@pam/config';
import { DUMMY_SAVED_BY_ROLE, DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { useStoryText } from '../support/useStoryText';

/**
 * Saved places on Home, as a strip of squares that runs past the page's
 * gutter and fades at the edge. Each square is a link to the place; the filled
 * bookmark in its corner un-saves it, and the square folds away — tap one to
 * see it go.
 */
function LocalisedStrip({ places, label, onRemove }: SavedStripProps) {
  const tr = useStoryText();
  const plain = useStoryText({ plain: true });
  const [shown, setShown] = useState(places);
  return (
    <SavedStrip
      places={shown.map((place) => ({ ...place, categoryLabel: tr(place.categoryLabel) }))}
      label={tr(label)}
      removeLabel={(name) => plain(`saved.remove?name=${name}`)}
      onRemove={(id) => {
        setShown((current) => current.filter((place) => place.id !== id));
        onRemove(id);
      }}
    />
  );
}

function asStrip(place: { id: string; name: string; category: Parameters<typeof categoryLabelKey>[0] }): SavedStripPlace {
  return {
    id: place.id,
    name: place.name,
    categoryLabel: categoryLabelKey(place.category),
    href: `/place/?id=${encodeURIComponent(place.id)}&from=home`,
  };
}

const meta = {
  title: 'Components/Cards/SavedStrip',
  tags: ['autodocs'],
  component: SavedStrip,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedStrip {...args} />,
  args: {
    places: (DUMMY_SAVED_BY_ROLE.member ?? []).map(asStrip),
    label: 'saved.title',
    removeLabel: (name) => name,
    onRemove: fn(),
  },
  argTypes: { removeLabel: { control: false } },
} satisfies Meta<typeof SavedStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A member's two example saves. */
export const Default: Story = {};

export const OneSaved: Story = {
  args: { places: [asStrip(DUMMY_PLACES_BY_ID['dummy-place-workforce']!)] },
};

/** More than fit: the strip scrolls and the last square fades out. */
export const ManySavedWithLongNames: Story = {
  args: {
    places: [
      ...Object.values(DUMMY_PLACES_BY_ID).map(asStrip),
      asStrip({
        id: 'coleman',
        name: 'Free Library of Philadelphia — Joseph E. Coleman Northwest Regional Library',
        category: 'education',
      }),
      asStrip({ id: 'fairhill', name: 'Fairhill Teen Tech Lab', category: 'education' }),
      asStrip({ id: 'kensington', name: 'Kensington Avenue Community Kitchen and Pantry', category: 'family_services' }),
    ],
  },
};

export const Spanish: Story = { ...ManySavedWithLongNames, globals: { locale: 'es' } };
