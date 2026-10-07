import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { Text } from '@astryxdesign/core/Text';
import type { SelectorOptionType } from '@astryxdesign/core/Selector';
import { Dropdown } from '@pam/ui/Dropdown';

/**
 * Pam's dropdown (D-370): the list opens under the box, never over it; the
 * box is a field's box (56px, 12px corners, 16px words); each row is 48px;
 * the chosen row has a heavier green tick. Use it for every choice from a
 * list — sign-up's city, the directory's filter. For two to four short
 * choices, `ChoiceChips` instead.
 */
const meta = {
  title: 'Components/Forms/Dropdown',
  tags: ['autodocs'],
  component: Dropdown,
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const NOTE = '__note';

function Cities({ isOpen = false, options }: { readonly isOpen?: boolean; readonly options: SelectorOptionType[] }) {
  const [value, setValue] = useState('Philadelphia');
  return (
    <Dropdown
      label="City you live in"
      options={options}
      isDefaultOpen={isOpen}
      value={value}
      onChange={(next: string) => {
        if (next !== NOTE) setValue(next);
      }}
      renderOption={(option) =>
        option.value === NOTE ? (
          <Text type="supporting" size="sm" justify="center">
            {option.label}
          </Text>
        ) : (
          option.label
        )
      }
    />
  );
}

const CITIES: SelectorOptionType[] = [
  { value: 'Philadelphia', label: 'Philadelphia' },
  { value: 'Pittsburgh', label: 'Pittsburgh' },
];

export const Default: Story = { args: { label: '', options: [] }, render: () => <Cities options={CITIES} /> };

/** Open, as on sign-up: the cities Pam is in, with the small print at the foot. */
export const OpenWithNote: Story = {
  args: { label: '', options: [] },
  render: () => (
    <Cities
      isOpen
      options={[...CITIES, { type: 'divider' }, { value: NOTE, label: 'Pam is only in these cities for now.', disabled: true }]}
    />
  ),
};
