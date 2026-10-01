import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page, StepHeader, type StepHeaderProps } from '@pam/ui';
import { useStoryText } from '../support/useStoryText';

/**
 * "Step 2 of 5", a bar, and a plain-language title, on every multi-step flow.
 * The count is text as well as a bar: somebody deciding whether they have time
 * for this needs a number. It does not animate between steps.
 */
function LocalisedStep({ title, current, total }: StepHeaderProps) {
  const tr = useStoryText();
  return (
    <StepHeader
      current={current}
      total={total}
      title={tr(title)}
      progressLabel={tr(`join.step?current=${current}&total=${total}`)}
    />
  );
}

const meta = {
  title: 'Components/StepHeader',
  component: StepHeader,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedStep {...args} />,
  args: { current: 1, total: 4, title: 'join.phone.title', progressLabel: '' },
  argTypes: {
    current: { control: { type: 'range', min: 1, max: 6 } },
    total: { control: { type: 'range', min: 1, max: 6 } },
    progressLabel: { control: false },
  },
} satisfies Meta<typeof StepHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sign-up, as `/join/` runs it. */
export const FirstStep: Story = {};
export const AboutYou: Story = { args: { current: 2, title: 'join.details.title' } };
export const WhatOthersCanSee: Story = { args: { current: 3, title: 'join.privacy.title.member' } };
export const LastStep: Story = { args: { current: 4, title: 'join.texts.title' } };

/** A program's sign-up, which has a longer middle. */
export const YourProgram: Story = { args: { current: 3, total: 5, title: 'join.program.title' } };

export const Spanish: Story = { ...WhatOthersCanSee, globals: { locale: 'es' } };
