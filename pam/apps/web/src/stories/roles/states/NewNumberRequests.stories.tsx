import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { NUMBER_CHANGE_ID, type NewNumberOptions } from '../../journeys/mockSupabase';
import { REDESIGN_ROUTES } from '../../prototype/routes';
import { press, sees, tickSpoke, words } from '../../support/newNumberSteps';

/**
 * Moving an account to a new phone number, from the side of the super admin who decides it (D-567), one story for each thing the
 * screens can say. The list row, the notices for an account that cannot be moved, each thing the database can refuse, and what
 * stands after a yes or a no show only after a tap or an answer, and the language-fit audit measures only what a story has drawn, so
 * each is its own story and each does the tap itself (tick the box, press Approve or Deny). Nothing is moved or sent: the pretend
 * database answers what the story says it does.
 */
const meta = { title: 'Super admin/States/New number requests' } satisfies Meta;

export default meta;
type Story = StoryObj;

const REVIEW = '/requests/number/';
const review = REDESIGN_ROUTES[REVIEW];
if (!review) throw new Error(`No prototype route for ${REVIEW} — add it to src/stories/prototype/routes.tsx`);
const LIST = '/requests/';
const list = REDESIGN_ROUTES[LIST];
if (!list) throw new Error(`No prototype route for ${LIST} — add it to src/stories/prototype/routes.tsx`);

type Steps = (args: { canvasElement: HTMLElement; globals: unknown }) => Promise<void>;
type Play = (args: { canvasElement: HTMLElement; globals: unknown }) => Promise<void>;

function opening(name: string, newNumber: NewNumberOptions, steps?: Steps): Story {
  return {
    ...asRole('super-admin', REVIEW, { id: NUMBER_CHANGE_ID }, { newNumber }),
    name,
    render: () => <>{review!.render()}</>,
    ...(steps ? { play: (async ({ canvasElement, globals }) => steps({ canvasElement, globals })) as Play } : {}),
  };
}

/** The review is drawn once the facts have come: the line that says what the request is. */
async function readyToDecide(canvasElement: HTMLElement, globals: unknown): Promise<void> {
  await sees(canvasElement, words(globals, 'newNumber.review.subtitle'));
}

/** The requests waiting on the super admin, with a super admin's account among them: its row says it cannot be moved. */
export const ListWithProtectedRow: Story = {
  ...asRole('super-admin', LIST, {}, { newNumber: { protectedRow: true } }),
  name: 'The list, with a super admin among them',
  render: () => <>{list!.render()}</>,
  play: (async ({ canvasElement, globals }) => {
    await sees(canvasElement, words(globals, 'newNumber.list.protected'));
  }) as Play,
};

/** "I spoke to this person" ticked, so Approve can be pressed. */
export const Ticked: Story = opening('The box ticked', {}, async ({ canvasElement, globals }) => {
  await readyToDecide(canvasElement, globals);
  await tickSpoke(canvasElement, globals);
});

/** A staff account (a program or a case manager): the line that says so. */
export const StaffAccount: Story = opening('A staff account', { review: 'staff' }, async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'newNumber.review.staff'));
});

/** A super admin's account: it cannot be moved, only denied. */
export const SuperAdminAccount: Story = opening('A super admin’s account', { review: 'protected' }, async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'newNumber.review.protected.body'));
});

/** No account has the old number they typed: nothing to move, only deny. */
export const NoAccount: Story = opening('No account has that old number', { review: 'noAccount' }, async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'newNumber.review.noAccount.body'));
});

/** Approve pressed after the tick, and the database refuses with `reason`: the notice that says why. */
function refused(name: string, decide: NonNullable<NewNumberOptions['decide']>): Story {
  return opening(name, { decide }, async ({ canvasElement, globals }) => {
    await readyToDecide(canvasElement, globals);
    await tickSpoke(canvasElement, globals);
    await press(canvasElement, words(globals, 'requests.approve'));
    await sees(canvasElement, words(globals, `newNumber.review.failed.${decide}.body`));
  });
}

export const RefusedAlreadyDecided: Story = refused('Somebody already decided this', 'decided');
export const RefusedMustSpeak: Story = refused('The database wants the tick', 'mustSpeak');
export const RefusedCannotMove: Story = refused('The account cannot be moved', 'cannotMove');
export const RefusedNoAccount: Story = refused('No account has that old number (on Approve)', 'noAccount');
export const RefusedNumberInUse: Story = refused('The new number already has an account', 'numberInUse');
export const RefusedOther: Story = refused('That did not go through', 'other');

/** A yes, and the move went through. */
export const Moved: Story = opening('Moved', {}, async ({ canvasElement, globals }) => {
  await readyToDecide(canvasElement, globals);
  await tickSpoke(canvasElement, globals);
  await press(canvasElement, words(globals, 'requests.approve'));
  await sees(canvasElement, words(globals, 'newNumber.review.moved.body'));
});

/** A yes, but the move did not go through: the notice, and "Move it now" to try again. */
export const NotMoved: Story = opening('Approved, but not moved yet', { moveFails: true }, async ({ canvasElement, globals }) => {
  await readyToDecide(canvasElement, globals);
  await tickSpoke(canvasElement, globals);
  await press(canvasElement, words(globals, 'requests.approve'));
  await sees(canvasElement, words(globals, 'newNumber.review.notMoved.body'));
});

/** A no. */
export const Denied: Story = opening('Denied', {}, async ({ canvasElement, globals }) => {
  await readyToDecide(canvasElement, globals);
  await press(canvasElement, words(globals, 'requests.deny'));
  await sees(canvasElement, words(globals, 'newNumber.review.denied.body'));
});
