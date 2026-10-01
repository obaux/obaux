import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page } from '@pam/ui';
import { CategoryChips } from '@pam/ui/CategoryChips';
import { CATEGORY_LIST } from '@pam/config';
import { CATEGORY_ICONS, type ExploreCategory } from '../../screens/ExploreView';
import { useStoryText } from '../support/useStoryText';

/**
 * Explore's chips (D-212): All and PAM's three categories, one always
 * chosen. They scroll sideways at 320px and in Spanish.
 */
function LocalisedChips({ initial }: { readonly initial: ExploreCategory }) {
  const tr = useStoryText();
  const [value, setValue] = useState<ExploreCategory>(initial);
  return (
    <CategoryChips
      label={tr('explore.categories')}
      value={value}
      onChange={setValue}
      chips={[
        { key: 'all', label: tr('places.all'), icon: CATEGORY_ICONS.all },
        ...CATEGORY_LIST.map((d) => ({ key: d.key, label: tr(d.labelKey), icon: CATEGORY_ICONS[d.key] })),
      ]}
    />
  );
}

const meta = {
  title: 'Components/CategoryChips',
  component: LocalisedChips,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  args: { initial: 'all' },
} satisfies Meta<typeof LocalisedChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllChosen: Story = {};
export const WorkChosen: Story = { args: { initial: 'workforce' } };
export const Spanish: Story = { globals: { locale: 'es' } };
export const Narrow: Story = { globals: { viewport: { value: 'narrow320', isRotated: false } } };
