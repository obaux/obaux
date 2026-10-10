import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton, Page, PlusIcon } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { ChoiceChips } from '@pam/ui/ChoiceChips';

/**
 * A secondary button has a light edge (Will, 10 October, on the website: it "was hard to
 * see on gray"). Its pale green fill all but disappears on a gray card or page, so it
 * carries a 1px ring in the theme's border colour, drawn as an inset shadow so no button
 * changes size. Not on icon-only buttons, not on choice chips (they draw their own edge),
 * not on primary. See `Button.tsx`.
 */
const styles = stylex.create({
  gray: {
    padding: '16px',
    borderRadius: '16px',
    backgroundColor: colorVars['--color-background-gray'],
  },
  row: { width: '100%' },
});

const meta = {
  title: 'Components/Actions/Secondary button',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Samples({ hasEdge }: { readonly hasEdge: boolean }) {
  return (
    <VStack gap={3} xstyle={styles.row}>
      <Button label="Message Marcus" variant="secondary" hasEdge={hasEdge} />
      <Button label="Leer la política de privacidad completa" variant="secondary" hasEdge={hasEdge} />
      <HStack>
        <Button label="Add" icon={<PlusIcon />} variant="secondary" isIconOnly hasEdge={hasEdge} />
      </HStack>
      <Button label="Save" variant="primary" />
    </VStack>
  );
}

/** The design as it is now: secondary buttons on a gray card, with the light edge. */
export const OnGray: Story = {
  render: () => (
    <VStack gap={3}>
      <VStack gap={3} xstyle={styles.gray}>
        <Text type="supporting">On a gray card</Text>
        <Samples hasEdge />
        <BigButton label="Not now" variant="secondary" />
      </VStack>
      <VStack gap={3}>
        <Text type="supporting">On the white page</Text>
        <Samples hasEdge />
      </VStack>
    </VStack>
  ),
};

/** Before, for comparison: the same buttons without the edge. Not a state anything should use. */
export const BeforeNoEdge: Story = {
  render: () => (
    <VStack gap={3}>
      <VStack gap={3} xstyle={styles.gray}>
        <Text type="supporting">On a gray card, without the edge (before)</Text>
        <Samples hasEdge={false} />
      </VStack>
    </VStack>
  ),
};

/** Where the ring does not apply: choice chips keep their own edge, the chosen one is filled. */
export const ChipsAreUnchanged: Story = {
  render: () => (
    <VStack gap={3} xstyle={styles.gray}>
      <ChoiceChips
        label="Language"
        options={[
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Español' },
          { value: 'zh-HK', label: '繁體中文' },
        ]}
        value="en"
        onChange={() => undefined}
      />
    </VStack>
  ),
};
