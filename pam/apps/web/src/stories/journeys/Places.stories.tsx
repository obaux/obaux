import type { Meta, StoryObj } from '@storybook/nextjs';
import PlacesPage from '../../app/places/page';
import { asRole } from './journey';

/** The list. Hours on the cards are placeholder hours (D-122, kept for demos). */
const meta = {
  title: 'Journeys/05 Places',
  component: PlacesPage,
} satisfies Meta<typeof PlacesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = asRole('member', '/places/');
export const ProgramManager: Story = asRole('provider', '/places/');
export const CaseManager: Story = asRole('case-manager', '/places/');
export const SuperAdmin: Story = asRole('super-admin', '/places/');
