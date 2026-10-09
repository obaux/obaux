import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { SegmentedControl } from '@astryxdesign/core/SegmentedControl';
import { VStack } from '@astryxdesign/core/VStack';
import { Segment } from '@pam/ui/Segment';
import { useI18n } from '../../lib/i18n';

/**
 * A choice in a segmented control that lets its words wrap (D-422). Astryx
 * keeps a segment to one line and trims the rest with an ellipsis; in a
 * longer language that leaves somebody choosing between "Prog…" and "Ges…".
 * Here a segment takes a second line instead, and grows to hold it.
 *
 * Use the toolbar's language switch (Russian is the longest) at a narrow
 * width: the About tabs are the same control.
 */
function Switch({ labels }: { readonly labels: readonly string[] }) {
  const [value, setValue] = useState('0');
  return (
    <SegmentedControl label="Example" value={value} onChange={setValue} size="md">
      {labels.map((label, i) => (
        <Segment key={label} value={String(i)} label={label} />
      ))}
    </SegmentedControl>
  );
}

function InYourLanguage() {
  const { t } = useI18n();
  return <Switch labels={[t('about.tab.member'), t('about.tab.admin'), t('about.tab.provider')]} />;
}

const meta = {
  title: 'Components/Inputs/Segment',
  tags: ['autodocs'],
  component: Segment,
  parameters: { layout: 'padded' },
  // Required by the type; every story here draws its own control.
  args: { value: 'day', label: 'Day' },
} satisfies Meta<typeof Segment>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The About tabs, in whichever language the toolbar says. */
export const About: Story = {
  render: () => <InYourLanguage />,
};

/** Three short words: one line each, as before. */
export const Short: Story = {
  render: () => <Switch labels={['Day', 'Week', 'Month']} />,
};

/** The same control with the longest words Pam has (Russian, Spanish): each segment is two lines, none is cut. */
export const Long: Story = {
  render: () => (
    <VStack gap={4}>
      <Switch labels={['Руководители программ', 'Кейс-менеджеры', 'Участники']} />
      <Switch labels={['Gestores de casos', 'Programas y servicios', 'Personas']} />
    </VStack>
  ),
};
