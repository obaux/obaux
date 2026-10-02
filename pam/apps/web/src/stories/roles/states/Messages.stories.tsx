import type { Meta, StoryObj } from '@storybook/nextjs';
import { MessagesView } from '../../../screens/MessagesView';
import { MessagesScreen } from '../../../screens/MessagesScreen';
import { HeaderActions } from '../../shell/HeaderActions';
import { asRedesign } from '../../journeys/journey';

/**
 * Messages on the tab-screen frame (D-213): scroll, and the title shrinks
 * into the bar. Tap search — the title gives way to a field and Cancel.
 */
const meta = {
  title: 'Member app/States/Messages',
  component: MessagesView,
  args: {
    rows: [],
    emptyBody: 'Once your case manager or your program messages you, it will show up here.',
    headerActions: <HeaderActions />,
  },
} satisfies Meta<typeof MessagesView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithMessages: Story = { ...asRedesign('member', '/messages/'), render: () => <MessagesScreen /> };
export const Empty: Story = { ...asRedesign('member', '/messages/') };
export const SearchNothingFound: Story = {
  ...asRedesign('member', '/messages/'),
  args: { initialSearch: 'zzz' },
};
export const Spanish: Story = { ...WithMessages, globals: { locale: 'es' } };
