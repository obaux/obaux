import type { Meta, StoryObj } from '@storybook/nextjs';
import { SavedGrid } from '@pam/ui/SavedGrid';
import { GlowIcon } from '@pam/ui/GlowIcon';
import { BigCategoryIcon } from '../../screens/SavedView';

/** Saved's tiles (D-292): category colour with a glow on white; a booked visit shows as a green tag. */
const meta = {
  title: 'Components/SavedGrid',
  component: SavedGrid,
  args: {
    label: 'Saved',
    tiles: [
      {
        id: 'a',
        name: 'Example Learning Center',
        subtitle: 'School and training',
        href: '/place/?id=dummy-place-learning&from=saved&trip=dummy-trip-1',
        art: (
          <GlowIcon tone="blue" size="lg">
            <BigCategoryIcon category="education" />
          </GlowIcon>
        ),
        tag: { day: 'Wed, Oct 7', time: '10:00 AM' },
        label: 'Example Learning Center. Your visit: Wed, Oct 7 · 10:00 AM',
      },
      {
        id: 'b',
        name: 'Example Food Pantry',
        subtitle: 'Home and family',
        href: '/place/?id=dummy-place-food&from=saved',
        art: (
          <GlowIcon tone="purple" size="lg">
            <BigCategoryIcon category="family_services" />
          </GlowIcon>
        ),
      },
    ],
  },
} satisfies Meta<typeof SavedGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One place with a visit booked, one without. */
export const WithAndWithoutAVisit: Story = {};
