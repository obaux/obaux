import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Card } from '@astryxdesign/core/Card';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
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
 * In these stories the save always fails, so the banner is what you see after the tap. What it offers depends on what failed (D-618):
 * Try again where the caller can run the action again, Sign in when the person is signed out, and Get help on the second failure of the same
 * action (never "contact Pam" in so many words).
 */
function FailingSwitch({ busy = false, code = 500, message }: { readonly busy?: boolean; readonly code?: string | number; readonly message?: string }) {
  const tr = useStoryText();
  const malfunction = useMalfunction();
  const [pending, setPending] = useState(false);
  const row = (
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
              const fail = () =>
                window.setTimeout(() => {
                  setPending(false);
                  // "Try again" runs the same action: here it fails the same way, which is the second failure.
                  malfunction.show('alerts.switch.closed', message ? { code, message } : { code }, event.target, { retry: () => { setPending(true); fail(); } });
                }, 400);
              fail();
            }}
          />
        }
      />
    </SettingsList>
  );
  if (!busy) return row;
  // A screen full of cards, so the alert is seen over real content and not an empty page: what is under it must not read through.
  return (
    <VStack gap={3}>
      {row}
      {['Program · Philadelphia', 'Mentor · Camden', 'Program · Chester', 'Case manager · Delaware', 'Program · Norristown', 'Mentor · Allentown', 'Program · Reading', 'Mentor · Lancaster', 'Program · York'].map((line) => (
        <Card key={line} padding={4}>
          <Text>{line}</Text>
        </Card>
      ))}
    </VStack>
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

/** Over a busy screen: the alert has a surface of its own, so the cards under it do not read through its words. */
export const OverContent: Story = { ...AfterTheTap, render: () => <FailingSwitch busy /> };

const tapSwitch = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(await within(canvasElement).findByRole('switch'));
  await expect(await within(document.body).findByRole('alert', {}, { timeout: 3000 })).toBeVisible();
};

export const Offline: Story = { render: () => <FailingSwitch busy code="offline" />, play: tapSwitch };
export const SignedOut: Story = { render: () => <FailingSwitch busy code={401} />, play: tapSwitch };
export const WrongTime: Story = { render: () => <FailingSwitch busy code={400} message="OUTSIDE_THE_VISIT_WINDOW" />, play: tapSwitch };
export const Changed: Story = { render: () => <FailingSwitch busy code={409} />, play: tapSwitch };
export const ServerFailed: Story = { render: () => <FailingSwitch busy code={500} />, play: tapSwitch };
/** The same action failing again after "Try again": the banner adds Get help. */
export const SecondFailure: Story = {
  render: () => <FailingSwitch busy code={500} />,
  play: async (context) => {
    await tapSwitch(context);
    // The banner's own buttons, whatever language it is in: the first is Try again, and once the same action fails again there is a second (Get help).
    const buttons = () => [...document.querySelectorAll<HTMLButtonElement>('[data-pam-malfunction] button')];
    await waitFor(() => expect(buttons().length).toBeGreaterThanOrEqual(2), { timeout: 3000 });
    await userEvent.click(buttons()[0]!);
    await waitFor(() => expect(buttons().length).toBeGreaterThanOrEqual(3), { timeout: 4000 });
  },
};

export const Spanish: Story = { ...AfterTheTap, globals: { locale: 'es' } };
export const Arabic: Story = { ...AfterTheTap, globals: { locale: 'ar' } };
