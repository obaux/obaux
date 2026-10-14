import type { Meta, StoryObj } from '@storybook/nextjs';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { PoweredByGoogle } from '@/screens/PoweredByGoogle';

/**
 * Google's attribution under the street suggestions (D-557): the "Google Maps" logo, 18px high (Google: 16 to 19), with
 * Google's clear space (10 left, right and top, 5 below), centred in the row, with the sheet's footer line centred under it (Will, 13 October); the words "Google Maps" stand in if the
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

export const Default: Story = { args: {} };

/** Left-aligned under a heading (Explore, when a typed address sorted the list): its clear space overlaps the page margin so its edge lines up. */
export const UnderAHeading: Story = { args: { align: 'start' } };

/** The mark and the footer line under the Google rows in the area sheet, both centred, at the sheet's 320px. */
export const WithFooterLine: Story = {
  render: () => (
    <VStack gap={2}>
      <PoweredByGoogle />
      <Text type="supporting" style={{ fontSize: '14px', lineHeight: 1.5, textAlign: 'center' }}>
        Pam remembers the area you pick on this phone only.
      </Text>
    </VStack>
  ),
};
