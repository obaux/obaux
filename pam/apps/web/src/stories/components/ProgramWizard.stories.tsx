import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { ProgramWizard } from '../../app/join/ProgramWizard';
import type { ProgramDetails } from '../../lib/useJoin';

/**
 * A program, one question a screen (D-347): name, kind, focus, about, where,
 * contact, services, then a review where every answer is a row back to its
 * question. Only the name is required; the rest have "Skip for now". Used at
 * sign-up and on Add a program.
 */
const EMPTY: ProgramDetails = {
  name: '',
  category: 'education',
  subcategory: '',
  description: '',
  address: '',
  phone: '',
  website: '',
  services: [],
};

function Wizard({ start, value }: { readonly start: number; readonly value: ProgramDetails }) {
  const [program, setProgram] = useState(value);
  const [step, setStep] = useState(start);
  return (
    <ProgramWizard
      value={program}
      onChange={setProgram}
      onSubmit={() => {}}
      busy={false}
      submitLabel="Send to Pam"
      step={step}
      onStep={setStep}
    />
  );
}

const meta = {
  title: 'Components/Forms/ProgramWizard',
  tags: ['autodocs'],
  component: Wizard,
  args: { start: 0, value: EMPTY },
} satisfies Meta<typeof Wizard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first question: the name. */
export const Name: Story = {};

/** What kind of help: chips, and Other opens a box for their own words (D-366). */
export const Kind: Story = { args: { start: 1, value: { ...EMPTY, name: 'Example Reentry Hub' } } };
export const KindOther: Story = {
  args: { start: 1, value: { ...EMPTY, name: 'Example Reentry Hub', category: 'other', categoryOther: 'Legal help' } },
};

/** The review: every answer, each a way back to change it. */
export const Review: Story = {
  args: {
    start: 6,
    value: {
      ...EMPTY,
      name: 'Example Reentry Hub',
      subcategory: 'ged',
      address: '200 Market St, Philadelphia, PA',
      phone: '(215) 555-0144',
      services: ['GED classes', 'Computer room'],
    },
  },
};
