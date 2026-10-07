import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page } from '@pam/ui';
import {
  PersonDetailSkeleton,
  PersonRowSkeletonList,
  PlaceCardSkeletonList,
  PlaceDetailSkeleton,
} from '@pam/ui/Skeletons';
import { useStoryText } from '../support/useStoryText';

/**
 * The shape of a screen before its data arrives, on the five screens that
 * fetch a list or a record: Places, a place, a caseload, the directory and a
 * person. Each is the outline of what is coming, so nothing jumps when it
 * lands; the label is announced, never drawn.
 *
 * Imported from `@pam/ui/Skeletons`, never the barrel, so Home does not carry
 * their weight.
 */
type Shape = 'placeList' | 'placeDetail' | 'personList' | 'personDetail';

function Skeletons({ shape, count }: { readonly shape: Shape; readonly count?: number }) {
  const tr = useStoryText();
  const label = tr('common.loading');
  switch (shape) {
    case 'placeList':
      return <PlaceCardSkeletonList label={label} count={count ?? 4} />;
    case 'personList':
      return <PersonRowSkeletonList label={label} count={count ?? 3} />;
    case 'placeDetail':
      return <PlaceDetailSkeleton label={label} />;
    case 'personDetail':
      return <PersonDetailSkeleton label={label} />;
  }
}

const meta = {
  title: 'Components/Feedback/Skeletons',
  tags: ['autodocs'],
  component: Skeletons,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  args: { shape: 'placeList' },
  argTypes: {
    shape: { control: 'inline-radio', options: ['placeList', 'placeDetail', 'personList', 'personDetail'] },
    count: { control: { type: 'range', min: 1, max: 8 } },
  },
} satisfies Meta<typeof Skeletons>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Places, while the list loads — four cards, as `/places/` asks for. */
export const Default: Story = {};

/** A place's own screen, while `service_detail` answers. */
export const PlaceDetail: Story = { args: { shape: 'placeDetail' } };

/** A caseload or the directory. */
export const PersonRowList: Story = { args: { shape: 'personList' } };

/** A person's profile. */
export const PersonDetail: Story = { args: { shape: 'personDetail' } };
