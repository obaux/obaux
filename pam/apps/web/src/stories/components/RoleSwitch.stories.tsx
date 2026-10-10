import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Page } from '@pam/ui';
import { RoleSwitch, type RoleSwitchProps } from '@pam/ui/RoleSwitch';
import { ROLES } from '@pam/config';
import { useStoryText } from '../support/useStoryText';

/**
 * A super admin's "Viewing as" control (D-132): an icon in the header that
 * opens a menu of roles. Icon-only, so the accessible name carries the state —
 * "Switch the view: Viewing as Member" while previewing. Only a super admin
 * ever sees it.
 */
function LocalisedSwitch({ label, options, ...rest }: RoleSwitchProps) {
  const tr = useStoryText();
  const plain = useStoryText({ plain: true });
  return (
    <HStack gap={2} align="center">
      <RoleSwitch
        {...rest}
        label={tr(label)}
        viewingLabel={(role) => plain(`view.as?role=${role}`)}
        options={options.map((option) => ({ value: option.value, label: tr(option.label) }))}
      />
      <Text type="supporting">{tr(`role.${rest.value}`)}</Text>
    </HStack>
  );
}

const meta = {
  title: 'Components/Inputs/RoleSwitch',
  tags: ['autodocs'],
  component: RoleSwitch,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedSwitch {...args} />,
  args: {
    value: 'super_admin',
    ownValue: 'super_admin',
    label: 'view.switch',
    viewingLabel: (role) => role,
    onChange: fn(),
    options: ROLES.map((role) => ({ value: role, label: `role.${role}` })),
  },
  argTypes: {
    value: { control: 'inline-radio', options: [...ROLES] },
    viewingLabel: { control: false },
  },
} satisfies Meta<typeof RoleSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ViewingAsMember: Story = { args: { value: 'member' } };
export const ViewingAsCaseManager: Story = { args: { value: 'admin' } };

/** The menu, open — the check mark is on the role being shown. */
export const Open: Story = {
  args: { value: 'provider' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button'));
  },
};

export const Spanish: Story = { ...Open, globals: { locale: 'es' } };
