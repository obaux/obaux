import type { Meta, StoryObj } from '@storybook/nextjs';
import { PoweredByGoogle } from '@/screens/PoweredByGoogle';

/**
 * Google's attribution under the street suggestions (D-557): the "Google Maps" logo, 18px high (Google: 16 to 19), with
 * Google's clear space (10 left, right and top, 5 below), at the end of the row; the words "Google Maps" stand in if the
 * file does not load. The light or dark file follows the browser's colour scheme (`prefers-color-scheme`), as the Pam
 * wordmark does, so check dark by switching the browser's or the OS's scheme.
 */
const meta = {
  title: 'Components/Places/PoweredByGoogle',
  component: PoweredByGoogle,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: '320px', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PoweredByGoogle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
