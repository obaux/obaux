import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page, TextField, type TextFieldProps } from '@pam/ui';
import { useStoryText } from '../support/useStoryText';

/**
 * Astryx's TextInput at Pam's 56px, with a `purpose` that sets the keyboard,
 * autofill and name for the job — `phone` gets the dial pad, `code` the
 * number pad and one-time-code autofill.
 *
 * Controlled, as the app uses it: the story keeps the value in state so the
 * field can be typed into.
 */
function LocalisedField({ label, description, value, status, ...rest }: TextFieldProps) {
  const tr = useStoryText();
  const [current, setCurrent] = useState(value ?? '');
  return (
    <TextField
      {...rest}
      label={tr(typeof label === 'string' ? label : '')}
      {...(description ? { description: tr(description) } : {})}
      {...(status ? { status: { ...status, message: tr(status.message) ?? undefined } } : {})}
      value={current}
      onChange={(next) => setCurrent(next)}
      width="100%"
    />
  );
}

const meta = {
  title: 'Components/TextField',
  component: TextField,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedField {...args} />,
  args: { label: 'signin.phone.label', purpose: 'phone', value: '' },
  argTypes: {
    purpose: {
      control: 'select',
      options: ['phone', 'code', 'inviteCode', 'address', 'name', 'lastName', 'city'],
    },
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Phone: Story = {};
export const PhoneFilled: Story = { args: { value: '215 555 0100' } };
export const Code: Story = { args: { label: 'signin.code.label', purpose: 'code', value: '123456' } };

export const InviteCode: Story = {
  args: { label: 'join.code.label', purpose: 'inviteCode', description: 'join.code.hint' },
};

export const Address: Story = {
  args: { label: 'places.areaLabel', purpose: 'address', description: 'places.areaHint' },
};

export const FirstName: Story = { args: { label: 'join.details.first', purpose: 'name', value: 'Jordan' } };

export const Required: Story = { args: { label: 'join.details.city', purpose: 'city', isRequired: true } };

export const Disabled: Story = { args: { value: '215 555 0100', isDisabled: true } };

export const WithError: Story = {
  args: {
    value: '555',
    status: { type: 'error', message: 'signin.phone.invalid' },
  },
};

export const Spanish: Story = { ...InviteCode, globals: { locale: 'es' } };
