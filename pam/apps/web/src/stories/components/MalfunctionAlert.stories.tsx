import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from 'storybook/test';
import { Switch } from '@astryxdesign/core/Switch';
import { SettingsList, SettingsRow } from '@pam/ui/SettingsList';
import { useMalfunction } from '@/lib/malfunction';
import { useStoryText } from '../support/useStoryText';

/**
 * When Pam fails (D-616, Will 18 October). A save, a switch or a send that did not go through shows one small alert,
 * fixed at the bottom of the screen above the tab bar, the keyboard and the safe area, in Lena's words
 * (`notice.malfunction`) and with no reason. It never covers the control that failed, takes no taps, is announced
 * once, and stays until the next tap or key, a successful retry, or leaving the screen: never on a timer.
 *
 * A switch moves only after its save has gone through. While it saves it stays where it was and shows it is
 * working. A reason the person can fix (a wrong code, a file too big) stays inline by the field.
 *
 * In these stories the save always fails, so the alert is what you see after the tap.
 */
function FailingSwitch() {
  const tr = useStoryText();
  const malfunction = useMalfunction();
  const [pending, setPending] = useState(false);
  return (
    <SettingsList>
      <SettingsRow
        label={tr('alerts.closed')}
        labelFor="malfunction-demo"
        control={
          <Switch
            label={tr('alerts.closed')}
            isLabelHidden
            value
            isLoading={pending}
            htmlName="malfunction-demo"
            onChange={(_on, event) => {
              setPending(true);
              // A save that answers with an error after a moment: the switch stays on, and the alert says so.
              window.setTimeout(() => {
                setPending(false);
                malfunction.show('alerts.switch.closed', { status: 500 }, event.target);
              }, 400);
            }}
          />
        }
      />
    </SettingsList>
  );
}

const meta = {
  title: 'Components/Feedback/Malfunction alert',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  render: () => <FailingSwitch />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tap the switch: it stays on while it saves, then the alert rises at the bottom. */
export const AfterTheTap: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('switch'));
    await expect(await within(document.body).findByRole('alert', {}, { timeout: 3000 })).toBeVisible();
  },
};

export const Spanish: Story = { ...AfterTheTap, globals: { locale: 'es' } };
export const Arabic: Story = { ...AfterTheTap, globals: { locale: 'ar' } };
