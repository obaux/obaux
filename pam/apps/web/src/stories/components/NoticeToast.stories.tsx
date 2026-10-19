import type { Meta, StoryObj } from '@storybook/nextjs';
import { VStack } from '@astryxdesign/core/VStack';
import { Card } from '@astryxdesign/core/Card';
import { Text } from '@astryxdesign/core/Text';
import { expect, userEvent, within } from 'storybook/test';
import { Notice, Page } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { useMalfunction } from '@/lib/malfunction';
import { NOTICES, type NoticeKey } from '@pam/config';
import { useStoryText } from '../support/useStoryText';

/**
 * A status Notice is a toast (D-619; Will, 19 October: "I want to stop using this style. Please use the toast banner instead."). The screen
 * still says `<Notice notice=… />`; where the app has a toast, it is drawn at the bottom of the screen, above the tab bar, in the same
 * stack as the failure banner (D-618), and goes when the state ends. A state that lasts (offline, a paused account, a page that cannot
 * load) has no close and cannot be swiped away; a one-off says `closable`. Until the toast has loaded, or if it cannot, the card
 * (Components › Feedback › Notice) is what is drawn: a state is never left unsaid.
 *
 * Shown here over a screen of real content, so what the toast covers and what it does not is visible.
 */
function Over({ notice, closable = false, fails = false }: { readonly notice: NoticeKey; readonly closable?: boolean; readonly fails?: boolean }) {
  const tr = useStoryText();
  const malfunction = useMalfunction();
  return (
    <Page gap={3}>
      <Text type="supporting">Your people</Text>
      {fails ? <Button label="Save" variant="secondary" clickAction={() => malfunction.show('alerts.switch.closed', { code: 500 }, null, { retry: () => undefined })} /> : null}
      {['Program · Philadelphia', 'Mentor · Camden', 'Program · Chester', 'Case manager · Delaware', 'Program · Norristown', 'Mentor · Allentown', 'Program · Reading', 'Mentor · Lancaster'].map((line) => (
        <Card key={line} padding={4}>
          <Text>{line}</Text>
        </Card>
      ))}
      <VStack>
        <Notice
          notice={notice}
          title={tr(NOTICES[notice].titleKey)}
          body={tr(NOTICES[notice].bodyKey)}
          contactLabel={tr('help.contact.action')}
          closable={closable}
        />
      </VStack>
    </Page>
  );
}

const meta = {
  title: 'Components/Feedback/Notice toast',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = { render: () => <Over notice="offline" /> };
export const AccountPaused: Story = { render: () => <Over notice="account_suspended" /> };
export const SomeThingsTurnedOff: Story = { render: () => <Over notice="account_limited" /> };
export const PageWontLoad: Story = { render: () => <Over notice="something_went_wrong" /> };
export const InviteExpired: Story = { render: () => <Over notice="invite_expired" /> };
/** A one-off the person may close. */
export const Closable: Story = { render: () => <Over notice="something_went_wrong" closable /> };
/** A state toast and the failure banner on screen together: one column, the banner at the bottom edge, nothing over anything. */
export const WithTheFailureBanner: Story = {
  render: () => <Over notice="offline" fails />,
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Save' }));
    await expect(await within(document.body).findByRole('button', { name: /try again/i }, { timeout: 3000 })).toBeVisible();
  },
};
export const Arabic: Story = { render: () => <Over notice="account_suspended" />, globals: { locale: 'ar' } };
