import type { Meta, StoryObj } from '@storybook/nextjs';
import { VStack } from '@astryxdesign/core/VStack';
import { FileSummary, GoogleLinkCard, MessageFileCard } from '@/app/messages/MessageFileCard';

/**
 * Documents and Google links in a conversation (D-399). A document shows its
 * icon, its name in full (two lines at most) and "PDF · 180 kB" before
 * anybody spends data on it; tapping downloads it with the person's own
 * sign-in and hands it to the phone. A Google Docs link in a message gets a
 * card under the words that opens it in Google, in a new tab.
 *
 * In these stories nothing is downloaded: the cards that open are given a
 * file already on this computer.
 */
const EXAMPLE_PDF = `data:application/pdf;base64,${btoa('%PDF-1.4\n%%EOF')}`;

const meta = {
  title: 'Components/Cards/MessageFileCard',
  tags: ['autodocs'],
  component: MessageFileCard,
  args: {
    file: { path: 'example/id-office-letter.pdf', name: 'ID office letter.pdf', bytes: 184_320 },
    localUrl: EXAMPLE_PDF,
  },
} satisfies Meta<typeof MessageFileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pdf: Story = {};

export const WordWithALongName: Story = {
  args: {
    file: {
      path: 'example/resume.docx',
      name: 'Marcus Johnson resume for the warehouse job at the North Philadelphia distribution center.docx',
      bytes: 1_258_291,
    },
  },
};

/** What sits above the box once a document is picked, before it is sent. */
export const Picked: Story = {
  render: () => <FileSummary name="Lease 2026.pdf" bytes={245_760} />,
};

/** A Google Docs, Sheets, Slides, Forms or Drive link in a message. */
export const GoogleLinks: Story = {
  render: () => (
    <VStack gap={3}>
      <GoogleLinkCard url="https://docs.google.com/document/d/example/edit" kind="doc" />
      <GoogleLinkCard url="https://docs.google.com/spreadsheets/d/example/edit" kind="sheet" />
      <GoogleLinkCard url="https://drive.google.com/file/d/example/view" kind="drive" />
    </VStack>
  ),
};
