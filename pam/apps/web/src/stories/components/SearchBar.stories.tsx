import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page } from '@pam/ui';
import { SearchBar } from '@pam/ui/SearchPill';
import { useStoryText } from '../support/useStoryText';

/**
 * The one search bar on Explore and the staff All programs (Will, 17 October, a86). At rest it is a centred pill; tap it and the pill
 * narrows to make room for Cancel on its right while the magnifier and the words slide to the left, ready to type. Always 60px high,
 * so nothing jumps. Cancel empties it and puts it back. With reduced motion it simply is in its next state.
 */
function Bar({ initial }: { readonly initial: string }) {
  const tr = useStoryText();
  const [value, setValue] = useState(initial);
  return (
    <SearchBar
      label={tr('explore.search.label')}
      placeholder={tr('explore.search.placeholder')}
      clearLabel={tr('explore.search.clear')}
      cancelLabel={tr('messages.search.cancel')}
      value={value}
      onChange={setValue}
    />
  );
}

const meta = {
  title: 'Components/Inputs/SearchBar',
  tags: ['autodocs'],
  component: Bar,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  args: { initial: '' },
} satisfies Meta<typeof Bar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At rest: centred. Tap it. */
export const AtRest: Story = {};
/** With words in it the bar is open: it comes back open. */
export const WithWords: Story = { args: { initial: '1500 Market' } };
export const Spanish: Story = { globals: { locale: 'es' } };
export const Arabic: Story = { globals: { locale: 'ar' } };
export const Narrow: Story = { globals: { viewport: { value: 'narrow320', isRotated: false } } };
