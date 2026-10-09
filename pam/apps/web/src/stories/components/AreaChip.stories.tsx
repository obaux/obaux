import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { AreaChip, Page, type AreaChipProps } from '@pam/ui';
import { useStoryText } from '../support/useStoryText';

/**
 * Where Places measures distance from, and the way to change it — one control
 * in the header (Will, 16 September). The visible text is the area; the
 * accessible name is the whole sentence, "Change the area: Near 19122".
 *
 * `label` is the area as `AreaPicker` words it (`places.near?area=…`), and the
 * accessible name is built from the same string, as the app does.
 */
function LocalisedChip({ label, onChange }: AreaChipProps) {
  const tr = useStoryText();
  // The accessible name is what a screen reader is given, so it is built from
  // the plain text, as the app does (D-435): no isolates in Arabic.
  const plain = useStoryText({ plain: true });
  return <AreaChip label={tr(label)} changeLabel={plain(`places.changeArea?area=${plain(label)}`)} onChange={onChange} />;
}

const meta = {
  title: 'Components/Inputs/AreaChip',
  tags: ['autodocs'],
  component: AreaChip,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedChip {...args} />,
  args: { label: 'places.near?area=City Hall', changeLabel: '', onChange: fn() },
  argTypes: { changeLabel: { control: false } },
} satisfies Meta<typeof AreaChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NearAZipCode: Story = { args: { label: 'places.near?area=19122' } };
export const NearMe: Story = { args: { label: 'places.nearMe' } };
export const NearHome: Story = { args: { label: 'places.nearHome' } };

/** An address long enough to hit the chip's 46vw cap and ellipsis. */
export const LongAddress: Story = { args: { label: 'places.near?area=1231 N Broad St, North Philadelphia' } };

export const Spanish: Story = { ...LongAddress, globals: { locale: 'es' } };

/**
 * The same address in Arabic (D-435). An English address inside an Arabic
 * sentence is laid out as a piece of its own, so it reads in order — "1231 N
 * Broad St, North Philadelphia", left to right, beside "بالقرب من" — and a
 * line too long for the chip loses the end of the address, as in English,
 * rather than its street number.
 */
export const Arabic: Story = { ...LongAddress, globals: { locale: 'ar' } };
