import type { Meta, StoryObj } from '@storybook/nextjs';
import { Heading } from '@astryxdesign/core/Heading';
import { VStack } from '@astryxdesign/core/VStack';
import { Page } from '@pam/ui';
import { DataHeading } from '@pam/ui/DataHeading';

/**
 * A heading whose text is a name — a place, a program, a person (D-534). It reads
 * in the direction of its own text, so a Latin name on an Arabic page keeps its
 * punctuation on the right side. Pam's own headings keep the page's direction.
 * Switch the toolbar to Arabic to see both.
 */
const meta = {
  title: 'Components/Text/DataHeading',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
} satisfies Meta;

export default meta;

export const NamesAndPamsWords: StoryObj = {
  render: () => (
    <VStack gap={3}>
      <Heading level={2}>Your trips</Heading>
      <DataHeading level={2}>Second Chance Café (Main St.)</DataHeading>
      <DataHeading level={2}>مركز الأمل للتوظيف</DataHeading>
    </VStack>
  ),
};
