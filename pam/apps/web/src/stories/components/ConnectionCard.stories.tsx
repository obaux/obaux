import type { Meta, StoryObj } from '@storybook/nextjs';
import { ConnectionCard } from '@pam/ui/ConnectionCard';
import { DUMMY_CONNECTIONS } from '@pam/config/dummy-connections';

const teresa = DUMMY_CONNECTIONS.find((c) => c.id === 'dummy-a1')!;
const sandra = DUMMY_CONNECTIONS.find((c) => c.id === 'dummy-p1')!;

/** A person on a member's side, as the whole profile: photo, name, program, how they help, three facts and a message button — use it on Connections. */
const meta = {
  title: 'Components/Cards/ConnectionCard',
  tags: ['autodocs'],
  component: ConnectionCard,
  args: {
    name: sandra.firstName,
    subtitle: sandra.programName ?? 'Example Learning Center',
    subtitleHref: `/place/?id=${sandra.placeId}&from=connections`,
    photoUrl: sandra.photoUrl,
    help: sandra.help.en,
    stats: [
      { value: String(sandra.yearsHelping), label: 'Years helping' },
      { value: String(sandra.peopleHelped), label: 'People helped' },
      { value: sandra.languages, label: 'Languages' },
    ],
    messageHref: `/messages/thread/?with=${sandra.id}`,
    messageLabel: `Message ${sandra.firstName}`,
    connectedBy: { label: `Connected by ${teresa.firstName}`, name: teresa.firstName, photoUrl: teresa.photoUrl },
  },
} satisfies Meta<typeof ConnectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A case manager: no program, so the subtitle is plain text and nobody "connected" them. */
export const CaseManager: Story = {
  args: {
    name: teresa.firstName,
    subtitle: 'Case manager',
    subtitleHref: null,
    photoUrl: teresa.photoUrl,
    help: teresa.help.en,
    stats: [
      { value: String(teresa.yearsHelping), label: 'Years helping' },
      { value: String(teresa.peopleHelped), label: 'People helped' },
      { value: teresa.languages, label: 'Languages' },
    ],
    messageHref: `/messages/thread/?with=${teresa.id}`,
    messageLabel: `Message ${teresa.firstName}`,
    connectedBy: null,
  },
};

/** No photo: the avatar shows initials. */
export const WithoutPhoto: Story = {
  args: { photoUrl: null, connectedBy: { label: 'Connected by Teresa', name: 'Teresa', photoUrl: null } },
};

/** Facts not filled in yet show a dash. */
export const UnknownStats: Story = {
  args: {
    stats: [
      { value: '—', label: 'Years helping' },
      { value: '—', label: 'People helped' },
      { value: '—', label: 'Languages' },
    ],
  },
};

/** A long program name ends in "…"; help text is clamped to three lines. */
export const LongText: Story = {
  args: {
    name: 'Guadalupe',
    subtitle: 'Free Library of Philadelphia — Joseph E. Coleman Northwest Regional Library',
    help: 'Helps with resumes, job applications and getting a library card. Guadalupe is at the Chelten Avenue branch most weekday afternoons, and can meet you there or talk on the phone first if that is easier for you.',
    messageLabel: 'Message Guadalupe',
  },
};
