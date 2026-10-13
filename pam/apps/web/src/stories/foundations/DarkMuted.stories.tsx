import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { EducationIcon, ShareIcon } from '@pam/ui';
import { CategoryArt } from '@pam/ui/CategoryArt';
import { NextTripCard } from '@pam/ui/NextTripCard';
import { IconTile } from '@pam/ui/Reading';
import { SubPageHeader } from '@pam/ui/SubPage';

/**
 * Dark mode's grey ground, before and after (D-504, Will, 11 October: "yes go for it"). `--color-background-muted`
 * is the ground of a thing set apart from the page: a guide tile, the card behind the next trip, the round back
 * button, the avatar. In dark it was `#1B1B1B`, the page itself, so none of them had a shape. It is `#262626` now (the
 * theme's own lifted ground), light mode untouched. Both panels are dark; the left one puts the old value back so the
 * two can be compared. Text on `#262626`: 15.1:1 primary, 10.7 accent, 9+ status, 5.65 secondary.
 */
const styles = stylex.create({
  panel: {
    display: 'block',
    colorScheme: 'dark',
    backgroundColor: colorVars['--color-background-body'],
    color: colorVars['--color-text-primary'],
    padding: '16px',
    borderRadius: '24px',
    width: '100%',
    minWidth: 0,
  },
  before: { '--color-background-muted': '#1B1B1B' },
  grid: { width: '100%', alignItems: 'flex-start' },
});

function Panel({ title, isBefore }: { readonly title: string; readonly isBefore?: boolean }) {
  return (
    // A plain element: Astryx's `xstyle` does not take a custom property, and this panel puts one back.
    <section {...stylex.props(styles.panel, isBefore && styles.before)}>
     <VStack gap={4}>
      <Text type="supporting">{title}</Text>
      <SubPageHeader title="Marcus" backHref="/" backLabel="Back" />
      <NextTripCard
        categoryLabel="School and training"
        categoryIcon={<EducationIcon width={20} height={20} aria-hidden />}
        art={<CategoryArt category="education" size="fill" />}
        title="Your next visit"
        when="Tue, Oct 13 · 10:00 AM"
        href="/trips/"
        label="Your next visit: School and training, Tue, Oct 13 · 10:00 AM."
      />
      <HStack gap={3} align="center">
        <IconTile tone="grey">
          <ShareIcon aria-hidden />
        </IconTile>
        <Avatar name="Marcus" size="lg" />
        <Text type="supporting">A grey tile and an avatar</Text>
      </HStack>
     </VStack>
    </section>
  );
}

const meta = {
  title: 'Foundations/Dark muted ground',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Before (left) and after (right), both in dark mode. */
export const BeforeAndAfter: Story = {
  render: () => (
    <HStack gap={4} wrap="wrap" xstyle={styles.grid}>
      <Panel title="Before: muted is #1B1B1B, the page" isBefore />
      <Panel title="After: muted is #262626" />
    </HStack>
  ),
};
