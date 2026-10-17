import type { Meta, StoryObj } from '@storybook/nextjs';
import { userEvent, within } from 'storybook/test';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ptBR from '@pam/config/locales/pt-BR.json';
import zhCN from '@pam/config/locales/zh-CN.json';
import zhHK from '@pam/config/locales/zh-HK.json';
import ru from '@pam/config/locales/ru.json';
import ar from '@pam/config/locales/ar.json';
import { asRole } from '../../journeys/journey';
import type { MockOptions } from '../../journeys/mockSupabase';
import { REDESIGN_ROUTES } from '../../prototype/routes';
import { screen } from '../screen';

/**
 * A super admin's decisions, each state on its own (D-584, Iris's super admin W1), for Lena's fit audit in all seven
 * languages: the confirm open, and the line after the decision. A long name on each: Anna-Christina
 * Castellanos-Whitfield's request, and Northwest Philadelphia Community Reentry and Workforce Training Center, sent by
 * Bartholomew. The buttons are found by their words in the Language toolbar's locale; the dialog is in the page's
 * portal, not the canvas. (Piper's reported-places states use the same lookup in SuperAdmin.stories.tsx; this file
 * keeps its own copy so the two branches do not edit one file.)
 */
const meta = { title: 'Super admin/States/Decisions' } satisfies Meta;
export default meta;
type Story = StoryObj;
type Play = NonNullable<Story['play']>;

const WORDS = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar } as Record<string, Record<string, string>>;
const wordFor = (globals: Record<string, unknown>, key: string): string =>
  (WORDS[String(globals['locale'] ?? 'en')] ?? (en as Record<string, string>))[key] ?? key;

const request = screen('super-admin', 'A request', '/requests/review/', { id: 'r-3' });
const program = screen('super-admin', 'A program to check', '/programs/review/item/', { id: 'check-5' });

/** Taps a footer button by its key, and the city first when the screen asks for one. */
const tap = (key: string): Play => async ({ canvasElement, globals }) => {
  const canvas = within(canvasElement);
  const radios = await canvas.findAllByRole('radio').catch(() => []);
  if (radios[0]) await userEvent.click(radios[0]);
  await userEvent.click(await canvas.findByRole('button', { name: wordFor(globals, key) }));
};
const confirm = (key: string, yesKey: string): Play => async (context) => {
  await tap(key)(context);
  const dialog = await within(context.canvasElement.ownerDocument.body).findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name: wordFor(context.globals, yesKey) }));
  context.canvasElement.ownerDocument.defaultView?.scrollTo(0, 0);
};

export const RequestApproveAsked: Story = { ...request, name: 'Request — Approve asked (long name)', play: tap('requests.approve') };
export const RequestDenyAsked: Story = { ...request, name: 'Request — Deny asked (long name)', play: tap('requests.deny') };
export const RequestApproved: Story = {
  ...request,
  name: 'Request — approved, said after (long name)',
  play: confirm('requests.approve', 'requests.confirm.approve.yes'),
};
export const RequestDenied: Story = {
  ...request,
  name: 'Request — denied, said after (long name)',
  play: confirm('requests.deny', 'requests.confirm.deny.yes'),
};

export const ProgramApproveAsked: Story = { ...program, name: 'Program — Approve asked (long name)', play: tap('requests.approve') };
export const ProgramApproved: Story = {
  ...program,
  name: 'Program — approved, said after (long name)',
  play: confirm('requests.approve', 'requests.confirm.approve.yes'),
};
export const ProgramChangesAsked: Story = {
  ...program,
  name: 'Program — note sent, said after (long name)',
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: wordFor(globals, 'review.askChanges') }));
    await userEvent.type(await canvas.findByRole('textbox'), 'Please add the opening hours.');
    await userEvent.click(canvas.getByRole('button', { name: wordFor(globals, 'review.note.send') }));
    canvasElement.ownerDocument.defaultView?.scrollTo(0, 0);
  },
};
export const ProgramChangesAskedNoLead: Story = {
  ...screen('super-admin', 'A program to check, no lead name', '/programs/review/item/', { id: 'check-7' }),
  name: 'Program — note sent, no lead name (long name)',
  play: ProgramChangesAsked.play,
};
export const ProgramDiscarded: Story = {
  ...screen('super-admin', 'A withdrawn program to check', '/programs/review/item/', { id: 'check-6' }),
  name: 'Program — discarded, said after (long name)',
  play: confirm('review.discard', 'review.discard.yes'),
};

/**
 * What Approve can meet instead (D-491; Lena's weekly review of the staff-request words): the database refuses, or the
 * person already had an account and is now a program lead too. The same long-named request; the answer comes from
 * the mock (`staffReview`).
 */
const refused = (staffReview: NonNullable<MockOptions['staffReview']>, name: string): Story => {
  const route = REDESIGN_ROUTES['/requests/review/']!;
  return {
    ...asRole('super-admin', '/requests/review/', { id: 'r-3' }, { staffReview }),
    name,
    render: () => <>{route.render()}</>,
    play: confirm('requests.approve', 'requests.confirm.approve.yes'),
  };
};
export const RequestAddedToExistingAccount = refused('addedToExisting', 'Request — approved, already had an account (long name)');
export const RequestRefusedPair = refused('pair', 'Request — refused, a different kind of account (long name)');
export const RequestRefusedCity = refused('city', 'Request — refused, their account is in another city (long name)');
export const RequestRefusedDecided = refused('decided', 'Request — refused, already decided');
export const RequestFailed = refused('other', 'Request — the decision failed');
