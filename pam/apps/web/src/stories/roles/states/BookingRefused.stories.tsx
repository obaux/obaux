import type { Meta, StoryObj } from '@storybook/nextjs';
import { Banner } from '@astryxdesign/core/Banner';
import { VStack } from '@astryxdesign/core/VStack';
import { Page } from '@pam/ui';
import { useI18n } from '@/lib/i18n';

/**
 * A program booking a visit for a member that the database refuses (D-595, Iris's b58 re-test): each refusal says what is true, under
 * "We could not save that", never "Try again" (which can never work for these). One banner each so the language fit audit measures all seven.
 * `member` gives no reason, on purpose: the database answers the same for every reason, so a lead cannot probe who has an account.
 */
const meta = {
  title: 'Program lead/States/Booking refused',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const REFUSALS = ['member', 'already', 'limit', 'past', 'far', 'place', 'service'] as const;
const VARS = { name: 'Jordan', place: 'Free Library of Philadelphia — Joseph E. Coleman Northwest Regional Library' };

function Banners() {
  const { t } = useI18n();
  return (
    <Page gap={4}>
      <VStack gap={3}>
        {REFUSALS.map((refusal) => (
          <Banner key={refusal} status="warning" title={t('join.failed.title')} description={t(`trips.new.refused.${refusal}`, VARS)} />
        ))}
      </VStack>
    </Page>
  );
}

/** All seven, with a long place name where the line holds one. */
export const AllSeven: Story = { render: () => <Banners /> };
