import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { SavedScreen, SavedView } from '../../../screens/SavedView';
import { HeaderActions } from '../../shell/HeaderActions';
import { asRedesign } from '../../journeys/journey';

/**
 * Saved on the tab-screen frame (D-213): places two to a row, a placeholder
 * picture each. Edit (top right) puts a × on each; removals wait for Done,
 * and leaving with any waiting asks first (D-255).
 */
const meta = {
  title: 'Member/Created/States/Saved',
  component: SavedView,
  args: {
    state: { status: 'ready', places: [] },
    onUnsave: fn(),
    headerActions: <HeaderActions />,
    edit: { isOn: false, isDirty: false, isAvailable: false, onEdit: fn(), onDone: fn() },
  },
} satisfies Meta<typeof SavedView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Places: Story = { ...asRedesign('member', '/saved/'), render: () => <SavedScreen /> };
export const Empty: Story = { ...asRedesign('member', '/saved/') };
export const Loading: Story = { ...asRedesign('member', '/saved/'), args: { state: { status: 'loading' } } };
export const Spanish: Story = { ...Places, globals: { locale: 'es' } };
