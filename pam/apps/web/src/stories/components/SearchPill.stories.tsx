import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { fn, userEvent, within } from 'storybook/test';
import { Page } from '@pam/ui';
import { SearchBar, SearchPill, type SearchPillItem } from '@pam/ui/SearchPill';
import type { SearchSource } from '@astryxdesign/core/Typeahead';
import { CATEGORY_ICONS } from '../../screens/ExploreView';
import { useStoryText } from '../support/useStoryText';

/**
 * The search bar (D-212). Type "main" — the suggestion is found by its
 * address, and the address is the line under its name. Type "zzz" for the
 * no-match line. The × clears it.
 */
const PROGRAMS: readonly (SearchPillItem & { readonly kind: 'education' | 'workforce' | 'family_services' })[] = [
  { id: 's1', label: 'Example Learning Center', description: '123 Main St', kind: 'education' },
  { id: 's2', label: 'Example Job Center', description: '456 Market St', kind: 'workforce' },
  { id: 's3', label: 'Example Family Services', description: '789 Broad St', kind: 'family_services' },
];

const source: SearchSource<(typeof PROGRAMS)[number]> = {
  search: (text) => {
    const q = text.toLowerCase();
    return PROGRAMS.filter((p) => `${p.label} ${p.description}`.toLowerCase().includes(q));
  },
  bootstrap: () => [],
};

function LocalisedPill({ onPick, onQuery }: { readonly onPick: () => void; readonly onQuery: () => void }) {
  const tr = useStoryText();
  return (
    <SearchPill
      label={tr('explore.search.label')}
      placeholder={tr('explore.search.placeholder')}
      searchSource={source}
      onPick={onPick}
      onQuery={onQuery}
      emptyText={tr('explore.search.none')}
      clearLabel={tr('explore.search.clear')}
      itemIcon={(item) => CATEGORY_ICONS[item.kind]}
    />
  );
}

const meta = {
  title: 'Components/Inputs/SearchPill',
  tags: ['autodocs'],
  component: LocalisedPill,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  args: { onPick: fn(), onQuery: fn() },
} satisfies Meta<typeof LocalisedPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Spanish: Story = { globals: { locale: 'es' } };
export const Narrow: Story = { globals: { viewport: { value: 'narrow320', isRotated: false } } };


/**
 * Explore's search bar (Will, 17 October, a86): at rest the pill, its magnifier and words centred; tapped, it narrows with
 * Cancel on its right and the words at the left. Cancel clears and closes.
 */
function Bar({ startOpen, startText }: { readonly startOpen: boolean; readonly startText: string }) {
  const tr = useStoryText();
  const [isOpen, setOpen] = useState(startOpen);
  const [value, setValue] = useState(startText);
  return (
    <SearchBar
      label={tr('explore.search.label')}
      placeholder={tr('explore.search.placeholder')}
      clearLabel={tr('explore.search.clear')}
      cancelLabel={tr('messages.search.cancel')}
      value={value}
      onChange={setValue}
      isOpen={isOpen}
      onOpenChange={setOpen}
    />
  );
}

export const BarAtRest: Story = { render: () => <Bar startOpen={false} startText="" /> };
export const BarOpen: Story = {
  render: () => <Bar startOpen={false} startText="" />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button'));
  },
};
export const BarTyped: Story = { render: () => <Bar startOpen startText="1500 Market St" /> };
export const BarOpenNarrow: Story = { ...BarOpen, globals: { viewport: { value: 'narrow320', isRotated: false } } };
export const BarOpenArabic: Story = { ...BarOpen, globals: { locale: 'ar' } };
