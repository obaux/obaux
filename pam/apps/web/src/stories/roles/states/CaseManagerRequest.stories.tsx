import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { installSupabaseMock } from '../../journeys/mockSupabase';
import { REDESIGN_ROUTES } from '../../prototype/routes';
import { fillAbout, installCaseManagerMock, press, sees, words, type CaseManagerMock } from '../../support/caseManagerSteps';

/**
 * "Join as a case manager", from the website (D-568), one story for each thing the screen can say. Most of them show only after a tap
 * or an answer (the form after the code, a problem line after Send, "We got your request" after the request is sent), and the
 * language-fit audit measures only what a story has drawn, so each is its own story and each does the tap itself. The person is signed
 * in with the phone only and has no profile, as the real one is; nothing is sent anywhere.
 */
const meta = { title: 'Member/Created/States/Case manager request' } satisfies Meta;

export default meta;
type Story = StoryObj;

const PATH = '/join/case-manager/';
const route = REDESIGN_ROUTES[PATH];
if (!route) throw new Error(`No prototype route for ${PATH} — add it to src/stories/prototype/routes.tsx`);

type Steps = (args: { canvasElement: HTMLElement; globals: unknown }) => Promise<void>;
type Play = (args: { canvasElement: HTMLElement; globals: unknown }) => Promise<void>;

/** Somebody signed in with a phone and no profile, the pretend database as `mock` says; `steps` are the taps. */
function asking(name: string, mock: CaseManagerMock, steps?: Steps): Story {
  return {
    ...asRole('signed-out', PATH),
    name,
    loaders: [
      async () => {
        installSupabaseMock('signed-out');
        installCaseManagerMock(mock);
        return {};
      },
    ],
    render: () => <>{route!.render()}</>,
    ...(steps ? { play: (async ({ canvasElement, globals }) => steps({ canvasElement, globals })) as Play } : {}),
  };
}

const atTheForm: Steps = async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'caseManager.form.title'));
};

/** "About you": the name, the city, where they work and the work email. */
export const Form: Story = asking('The form', {}, atTheForm);

/** Send pressed with the boxes empty. */
export const ProblemMissing: Story = asking('Send with nothing filled in', {}, async (args) => {
  await atTheForm(args);
  await press(args.canvasElement, words(args.globals, 'caseManager.send'));
  await sees(args.canvasElement, words(args.globals, 'caseManager.problem.missing'));
});

/** Everything filled in, but the email is not one: caught before anything is sent. */
export const ProblemEmail: Story = asking('The email is not an email', {}, async (args) => {
  await atTheForm(args);
  await fillAbout(args.canvasElement, args.globals, 'dana-at-riverside');
  await press(args.canvasElement, words(args.globals, 'caseManager.send'));
  await sees(args.canvasElement, words(args.globals, 'caseManager.problem.email'));
});

/** The database says what they typed cannot be used. */
export const ProblemInvalid: Story = asking('The database says check what you typed', { ask: 'invalid' }, async (args) => {
  await atTheForm(args);
  await fillAbout(args.canvasElement, args.globals, 'dana@riverside.example');
  await press(args.canvasElement, words(args.globals, 'caseManager.send'));
  await sees(args.canvasElement, words(args.globals, 'caseManager.problem.invalid'));
});

/** Anything else that goes wrong: the line, and Contact Pam under it. */
export const ProblemOther: Story = asking('It did not send', { ask: 'other' }, async (args) => {
  await atTheForm(args);
  await fillAbout(args.canvasElement, args.globals, 'dana@riverside.example');
  await press(args.canvasElement, words(args.globals, 'caseManager.send'));
  await sees(args.canvasElement, words(args.globals, 'caseManager.problem.other'));
});

/** Just sent: "We got your request". */
export const Sent: Story = asking('We got your request', {}, async (args) => {
  await atTheForm(args);
  await fillAbout(args.canvasElement, args.globals, 'dana@riverside.example');
  await press(args.canvasElement, words(args.globals, 'caseManager.send'));
  await sees(args.canvasElement, words(args.globals, 'caseManager.sent.title'));
});

/** Back on a later visit, still being checked. */
export const Waiting: Story = asking('Still being checked', { standing: 'waiting' }, async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'caseManager.waiting.title'));
});

/** The super admin said no: the line, Ask again and Contact Pam. */
export const Denied: Story = asking('We could not say yes this time', { standing: 'denied' }, async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'caseManager.denied.title'));
});

/** Ask again pressed: the form again, with what they sent last time already in it. */
export const AskedAgain: Story = asking('Ask again, with the last answers in it', { standing: 'denied' }, async ({ canvasElement, globals }) => {
  await sees(canvasElement, words(globals, 'caseManager.denied.title'));
  await press(canvasElement, words(globals, 'caseManager.askAgain'));
  await sees(canvasElement, words(globals, 'caseManager.form.title'));
});

/** Somebody who already has an account opened it while signed in to it (or whose request was approved): nothing to ask. */
export const HasAccount: Story = {
  ...asRole('member', PATH),
  name: 'This phone already has an account',
  render: () => <>{route!.render()}</>,
};
