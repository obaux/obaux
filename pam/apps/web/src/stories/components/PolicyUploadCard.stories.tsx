import type { Meta, StoryObj } from '@storybook/nextjs';
import { PolicyUploadCard } from '@pam/ui/PolicyUploadCard';

/**
 * Adding a policy (D-348): a dashed card with a PDF in a tinted circle, one
 * line on what to add, and Choose files. A file dragged onto it on a
 * computer lights the card up. Use it at the top of a list of documents.
 */
const meta = {
  title: 'Components/Actions/PolicyUploadCard',
  tags: ['autodocs'],
  component: PolicyUploadCard,
  args: {
    title: 'Add a policy',
    hint: 'A PDF, or a photo of each page.',
    buttonLabel: 'Choose files',
    onFiles: () => {},
  },
} satisfies Meta<typeof PolicyUploadCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** In Spanish. */
export const Spanish: Story = {
  args: { title: 'Agregar una política', hint: 'Un PDF, o una foto de cada página.', buttonLabel: 'Elegir archivos' },
};
