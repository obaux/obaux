import type { Meta, StoryObj } from '@storybook/nextjs';
import RequestsPage from '../../app/requests/page';
import { asRole } from './journey';

/** Deciding who becomes a case manager or program lead. */
const meta = {
  title: 'Journeys/15 Staff requests',
  component: RequestsPage,
} satisfies Meta<typeof RequestsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SuperAdmin: Story = asRole('super-admin', '/requests/');
