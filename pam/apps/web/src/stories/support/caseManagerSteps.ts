import { userEvent, waitFor, within } from 'storybook/test';
import ar from '@pam/config/locales/ar.json';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ptBR from '@pam/config/locales/pt-BR.json';
import ru from '@pam/config/locales/ru.json';
import zhCN from '@pam/config/locales/zh-CN.json';
import zhHK from '@pam/config/locales/zh-HK.json';
import { SUPABASE_URL } from '../../lib/project';
import { ME_ID } from '../journeys/fixtures';

/**
 * What the stories for "Join as a case manager" (D-568) need that the shared pretend database does not give them, and the taps a person
 * takes on that screen (stories only). A state that shows only after a tap or an answer is invisible to the language-fit audit until a
 * story takes the tap, so each state has its own story; the words to look for come from the language the story is shown in.
 *
 * The pretend answers sit here, not in `mockSupabase.ts`, so this work and the new-number stories (D-567) do not edit the same lines.
 */
const BUNDLES: Record<string, Record<string, string>> = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar };

/** What a language says for a key (English if the story is shown in a language without it). */
export function words(globals: unknown, key: string): string {
  const locale = (globals as { locale?: string } | undefined)?.locale ?? 'en';
  const bundle: Record<string, string> = BUNDLES[locale] ?? BUNDLES['en']!;
  return bundle[key] ?? BUNDLES['en']![key] ?? key;
}

const IGNORED = /[⁦-⁩‎‏؜]/g;
const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/** Press the button that says `label`. */
export async function press(canvasElement: HTMLElement, label: string): Promise<void> {
  await userEvent.click(await page(canvasElement).findByRole('button', { name: label }));
}

/** Wait until the page says `text`. */
export async function sees(canvasElement: HTMLElement, text: string): Promise<void> {
  await waitFor(
    () => {
      if (!canvasElement.ownerDocument.body.innerText.replace(IGNORED, '').includes(text.replace(IGNORED, ''))) {
        throw new Error(`the page does not say "${text}" yet`);
      }
    },
    { timeout: 6000 },
  );
}

/** Type into the box labelled `label`. */
async function typeInto(canvasElement: HTMLElement, label: string, text: string): Promise<void> {
  const box = await page(canvasElement).findByLabelText(label, { exact: false });
  await userEvent.type(box, text);
}

/** Fill "About you" the way a person does, with a work email that `email` makes good or bad; the city is the one the pretend database serves. */
export async function fillAbout(canvasElement: HTMLElement, globals: unknown, email: string): Promise<void> {
  await typeInto(canvasElement, words(globals, 'join.details.first'), 'Dana');
  await typeInto(canvasElement, words(globals, 'join.details.last'), 'Reyes');
  await typeInto(canvasElement, words(globals, 'caseManager.organization.label'), 'Riverside Reentry Services');
  await typeInto(canvasElement, words(globals, 'caseManager.email.label'), email);
}

/** What the pretend database says about the person who asks: signed in with the phone only (no profile) and where the request stands. */
export interface CaseManagerMock {
  /** Where this sign-in's request stands. Without it the person has asked for nothing yet. */
  readonly standing?: 'waiting' | 'denied';
  /** What asking answers, in the database's own words; without it the request is received. */
  readonly ask?: 'invalid' | 'other';
}

const ASK_REFUSALS: Record<NonNullable<CaseManagerMock['ask']>, string> = {
  invalid: 'INVALID',
  other: 'SOMETHING_ELSE',
};

const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0];

const urlOf = (input: RequestInfo | URL): string => (typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/**
 * Sign in with a phone and no profile (the person has proved the number and Pam has no record of it), and answer the three things this
 * screen asks, ahead of the shared pretend database. Call it after `installSupabaseMock('signed-out')`: it wraps the fetch that installs.
 */
export function installCaseManagerMock(mock: CaseManagerMock): void {
  window.localStorage.setItem(
    `sb-${PROJECT_REF}-auth-token`,
    JSON.stringify({
      access_token: 'storybook',
      refresh_token: 'storybook',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: ME_ID, aud: 'authenticated', role: 'authenticated' },
    }),
  );
  const next = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = urlOf(input);
    if (!url.includes('.supabase.co')) return next(input, init);
    if (url.includes('/auth/v1/user')) return json({ id: ME_ID, phone: '12155550199' });
    // No profile for this phone.
    if (url.includes('/rest/v1/profiles')) return json(null);
    // This sign-in's own request, if it made one.
    if (url.includes('/rest/v1/staff_requests') && url.includes('user_id=eq.')) {
      return json(
        mock.standing
          ? {
              wants_role: 'admin',
              decision: mock.standing === 'denied' ? 'denied' : null,
              first_name: 'Dana',
              last_name: 'Reyes',
              city: 'Philadelphia',
              organization: 'Riverside Reentry Services',
            }
          : null,
      );
    }
    if (url.includes('/rpc/request_case_manager_access')) {
      return mock.ask ? json({ code: 'P0001', message: ASK_REFUSALS[mock.ask] }, 400) : json('received');
    }
    return next(input, init);
  };
}
