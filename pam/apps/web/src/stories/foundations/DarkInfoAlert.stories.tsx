import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * The blue (info) alert in dark mode, before and after (Will, 11 October: "the blue alert use in dark mode is too
 * blue. Let's dim that background to 10%"). Its ground is the alert blue, `#88bcff`, at 10% over the page; it was 24%.
 * The words and the icon stay blue, so it still reads as information. Light mode is untouched. It is one token,
 * `--astryx-theme-neutral-color-status-muted-accent`, so every blue alert follows. Words on the new ground: 8.4:1 (AAA),
 * the icon 7.3:1 (the old ground gave 6.1 and 5.2). Both panels are dark; the left one puts the old value back.
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
  before: { '--astryx-theme-neutral-color-status-muted-accent': '#88bcff3D' },
  grid: { width: '100%', alignItems: 'flex-start' },
});

function Panel({ title, isBefore }: { readonly title: string; readonly isBefore?: boolean }) {
  return (
    // A plain element: Astryx's `xstyle` does not take a custom property, and this panel puts one back.
    <section {...stylex.props(styles.panel, isBefore && styles.before)}>
      <VStack gap={4}>
        <Text type="supporting">{title}</Text>
        <Banner status="info" title="You are signed out." />
        <Banner
          status="info"
          title="Dana invited you to be a member."
          description="Sign in with your phone number to start."
        />
      </VStack>
    </section>
  );
}

const meta = {
  title: 'Foundations/Dark blue alert',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Before (left) and after (right), both in dark mode. */
export const BeforeAndAfter: Story = {
  render: () => (
    <HStack gap={4} wrap="wrap" xstyle={styles.grid}>
      <Panel title="Before: the alert blue at 24%" isBefore />
      <Panel title="After: the alert blue at 10%" />
    </HStack>
  ),
};
