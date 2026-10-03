import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page } from '@pam/ui';
import { CodeBoxes } from '@pam/ui/CodeBoxes';

/**
 * The sign-in code as six small boxes (D-251) — one real field underneath,
 * so a pasted or autofilled code drops straight in. Type or paste here.
 */
function Boxes({ initial }: { readonly initial: string }) {
  const [code, setCode] = useState(initial);
  return <CodeBoxes label="The code we texted you" value={code} onChange={setCode} />;
}

const meta = {
  title: 'Components/CodeBoxes',
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
} satisfies Meta;

export default meta;

export const Empty: StoryObj = { render: () => <Boxes initial="" /> };

export const PartlyTyped: StoryObj = { render: () => <Boxes initial="12" /> };

export const Full: StoryObj = { render: () => <Boxes initial="123456" /> };
