import type { Meta, StoryObj } from '@storybook/nextjs';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { SettingsList, SettingsRow } from '@pam/ui/SettingsList';

/**
 * A list of settings (D-615, Will, 18 October): no card around it, each setting its own row, rows divided by a thin line.
 * The name, then the badge under it when the setting is not on yet, then the switch at the end. The same pattern for
 * any list of switches (Text alerts, the consent screen). It mirrors in Arabic and wraps rather than cuts at 320.
 */
const meta = {
  title: 'Components/Lists/SettingsList',
  tags: ['autodocs'],
  component: SettingsList,
} satisfies Meta<typeof SettingsList>;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ label, badge, on = false }: { label: string; badge?: string; on?: boolean }) => (
  <SettingsRow
    label={label}
    badge={badge}
    control={<Switch label={label} isLabelHidden value={on} changeAction={() => undefined} isDisabled={Boolean(badge)} />}
  />
);

/** Some on, some not yet. */
export const Default: Story = {
  args: { children: null },
  render: () => (
    <VStack gap={2}>
      <Text type="supporting">Please select when you'd like to receive a text notification.</Text>
      <SettingsList>
        <Row label="A saved place closes" on />
        <Row label="Someone messages you" badge="Coming soon" />
        <Row label="Someone wants to connect" badge="Coming soon" />
      </SettingsList>
    </VStack>
  ),
};

/** A long name takes the whole width and wraps; the badge stays under it. */
export const LongNames: Story = {
  args: { children: null },
  render: () => (
    <SettingsList>
      <Row label="Alguien cambia una reserva de una visita a uno de sus programas" badge="Próximamente" />
      <Row label="Someone you are connected with writes to you about a visit that changed" badge="Coming soon" />
      <Row label="A saved place closes" on />
    </SettingsList>
  ),
};
