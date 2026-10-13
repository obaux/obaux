import { userEvent, waitFor, within } from 'storybook/test';
import ar from '@pam/config/locales/ar.json';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ptBR from '@pam/config/locales/pt-BR.json';
import ru from '@pam/config/locales/ru.json';
import zhCN from '@pam/config/locales/zh-CN.json';
import zhHK from '@pam/config/locales/zh-HK.json';

/**
 * The steps a person takes on the two "new phone number" screens (D-567), for the stories that show each state they reach (stories
 * only). A state that shows only after a tap is invisible to the language-fit audit until a story takes the tap, so each state has
 * its own story; these are the taps. The words to look for come from the language the story is shown in, so the same steps work in
 * all seven.
 */
const BUNDLES: Record<string, Record<string, string>> = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar };

/** What a language says for a key (English if the story is shown in a language without it). */
export function words(globals: unknown, key: string): string {
  const locale = (globals as { locale?: string } | undefined)?.locale ?? 'en';
  const bundle: Record<string, string> = BUNDLES[locale] ?? BUNDLES['en']!;
  return bundle[key] ?? BUNDLES['en']![key] ?? key;
}

/** The whole page the story is drawn in: a sheet, a footer or a notice can sit outside the story's own element. */
const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/** Press the button that says `label`. */
export async function press(canvasElement: HTMLElement, label: string): Promise<void> {
  const button = await page(canvasElement).findByRole('button', { name: label });
  await userEvent.click(button);
}

/** Wait until the page says `text` (a title the screen shows once a step has gone through). */
export async function sees(canvasElement: HTMLElement, text: string): Promise<void> {
  await waitFor(
    () => {
      const found = canvasElement.ownerDocument.body.innerText.replace(/[⁦-⁩‎‏؜]/g, '');
      if (!found.includes(text.replace(/[⁦-⁩‎‏؜]/g, ''))) throw new Error(`the page does not say "${text}" yet`);
    },
    { timeout: 6000 },
  );
}

/** Fill the first three boxes of "Your account" (old number, first name, last name); the city is the one the pretend database serves. */
export async function fillTheAsk(canvasElement: HTMLElement): Promise<void> {
  const doc = canvasElement.ownerDocument;
  const boxes = await waitFor(
    () => {
      const found = Array.from(doc.querySelectorAll<HTMLInputElement>('input')).filter(
        (box) => !['checkbox', 'radio', 'hidden', 'button', 'submit'].includes(box.type),
      );
      if (found.length < 3) throw new Error('the form has not drawn its boxes yet');
      return found;
    },
    { timeout: 6000 },
  );
  await userEvent.type(boxes[0]!, '2155550142');
  await userEvent.type(boxes[1]!, 'Rosa');
  await userEvent.type(boxes[2]!, 'Diaz');
}

/** Tick "I spoke to this person" on the super admin's review. */
export async function tickSpoke(canvasElement: HTMLElement, globals: unknown): Promise<void> {
  const box = await page(canvasElement).findByRole('checkbox', { name: words(globals, 'newNumber.review.spoke') });
  await userEvent.click(box);
}
