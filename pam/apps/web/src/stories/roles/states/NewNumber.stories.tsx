import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import type { NewNumberOptions } from '../../journeys/mockSupabase';
import { REDESIGN_ROUTES } from '../../prototype/routes';
import { fillTheAsk, press, sees, words } from '../../support/newNumberSteps';

/**
 * Moving an account to a new phone number, from the side of the person who asks (D-567), one story for each thing the screen can say.
 * Most of them show only after a tap or an answer (the form after the code, a problem line after Send, "we got your request" after
 * the request is sent), and the language-fit audit measures only what a story has drawn, so each is its own story and each does the
 * tap itself. They are signed in with the new number only and have no profile, as the real person is; nothing is sent anywhere.
 */
const meta = { title: 'Member/Created/States/New number' } satisfies Meta;

export default meta;
type Story = StoryObj;

const PATH = '/signin/new-number/';
const route = REDESIGN_ROUTES[PATH];
if (!route) throw new Error(`No prototype route for ${PATH} — add it to src/stories/prototype/routes.tsx`);

type Steps = (args: { canvasElement: HTMLElement; globals: unknown }) => Promise<void>;

/** The person signed in with the new number only, with the pretend database set as `newNumber` says; `steps` are the taps. */
function asking(name: string, newNumber: NewNumberOptions, steps?: Steps): Story {
  return {
    ...asRole('signed-out', PATH, {}, { newNumber: { signInOnly: true, ...newNumber } }),
    name,
    render: () => <>{route!.render()}</>,
    ...(steps ? { play: async ({ canvasElement, globals }: { canvasElement: HTMLElement; globals: unknown }) => steps({ canvasElement, globals }) } : {}),
  };
}

/** "Your account": the old number, the name, the city and who on Pam knows them. */
export const Form: Story = asking('The form', {}, async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'newNumber.form.title'));
});

/** Send pressed with the boxes empty. */
export const ProblemMissing: Story = asking('Send with nothing filled in', {}, async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'newNumber.form.title'));
  await press(canvasElement, words(globals, 'newNumber.send'));
  await sees(canvasElement, words(globals, 'newNumber.problem.missing'));
});

/** The database says the old number is not a number it can use. */
export const ProblemInvalid: Story = asking('The old number is not right', { ask: 'invalid' }, async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'newNumber.form.title'));
  await fillTheAsk(canvasElement);
  await press(canvasElement, words(globals, 'newNumber.send'));
  await sees(canvasElement, words(globals, 'newNumber.problem.invalid'));
});

/** Too many requests for this number: the line, and Contact Pam under it. */
export const ProblemTooMany: Story = asking('Too many requests', { ask: 'tooMany' }, async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'newNumber.form.title'));
  await fillTheAsk(canvasElement);
  await press(canvasElement, words(globals, 'newNumber.send'));
  await sees(canvasElement, words(globals, 'newNumber.problem.tooMany'));
});

/** Anything else that goes wrong: the line, and Contact Pam under it. */
export const ProblemOther: Story = asking('It did not go through', { ask: 'other' }, async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'newNumber.form.title'));
  await fillTheAsk(canvasElement);
  await press(canvasElement, words(globals, 'newNumber.send'));
  await sees(canvasElement, words(globals, 'newNumber.problem.other'));
});

/** Just sent: "We got your request". */
export const Received: Story = asking('We got your request', {}, async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'newNumber.form.title'));
  await fillTheAsk(canvasElement);
  await press(canvasElement, words(globals, 'newNumber.send'));
  await sees(canvasElement, words(globals, 'newNumber.received.body'));
});

/** Back on a later day, still being checked. */
export const Waiting: Story = asking('Still being checked', { standing: 'waiting' });

/** The super admin said yes: sign in again with the new number. */
export const Approved: Story = asking('Your account is moving', { standing: 'approved' });

/** The super admin said no: the line, and Contact Pam. */
export const Denied: Story = asking('We could not move your account', { standing: 'denied' });

/** Somebody who already has an account opened it while signed in to it: nothing to move. */
export const HasAccount: Story = {
  ...asRole('member', PATH),
  name: 'This number already has an account',
  render: () => <>{route!.render()}</>,
};
