import type { Meta, StoryObj } from '@storybook/nextjs';
import { SavedGrid } from '@pam/ui/SavedGrid';
import { CategoryIcon } from '../../screens/SavedView';

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
          <CategoryIcon category="education" />
        ),
        tone: 'blue',
        tag: 'Oct 7 · 10:00 AM',
        label: 'Example Learning Center. Your visit: Oct 7 · 10:00 AM',
      },
      {
        id: 'b',
        name: 'Example Food Pantry',
        subtitle: 'Home and family',
        href: '/place/?id=dummy-place-food&from=saved',
        tone: 'purple',
        art: (
          <CategoryIcon category="family_services" />
        ),
      },
    ],
  },
} satisfies Meta<typeof SavedGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One place with a visit booked, one without. */
export const WithAndWithoutAVisit: Story = {};
