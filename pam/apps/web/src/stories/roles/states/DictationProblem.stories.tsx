import type { Meta, StoryObj } from '@storybook/nextjs';
import ar from '@pam/config/locales/ar.json';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ptBR from '@pam/config/locales/pt-BR.json';
import ru from '@pam/config/locales/ru.json';
import zhCN from '@pam/config/locales/zh-CN.json';
import zhHK from '@pam/config/locales/zh-HK.json';
import { CONVO_ID } from '../../journeys/fixtures';
import { screen } from '../screen';

/**
 * Speaking a message that cannot start (D-603, W4): the five lines Pam's warning banner says above the message box, one story per
 * kind. The banner only shows after a failed start, and the conversation takes no prop to force it, so each story does what a
 * phone does: it stands in for the browser's speech recogniser (the same stand-in `e2e/messages.spec.ts` uses, told to fail with
 * the code the browser would send) before the screen is drawn, then taps "Speak your message" in the language the story is shown
 * in. The fit audit measures the banner in all seven languages this way; nothing leaves the story.
 */
const meta = { title: 'Member/Created/States/Speaking a message' } satisfies Meta;

export default meta;
type Story = StoryObj;

const BUNDLES: Record<string, Record<string, string>> = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar };

/** A line of the page in the language this story is being shown in. */
const words = (locale: string | undefined, key: string) => BUNDLES[locale ?? 'en']?.[key] ?? en[key as keyof typeof en];

/** The browser's speech recogniser, told to fail the way the browser says (`error` is its code). */
function standInFor(error: string): void {
  type Handler = ((event?: unknown) => void) | null;
  class FakeRecognition {
    lang = '';
    continuous = true;
    interimResults = true;
    onstart: Handler = null;
    onend: Handler = null;
    onresult: Handler = null;
    onerror: Handler = null;
    onnomatch: Handler = null;
    onspeechstart: Handler = null;
    onspeechend: Handler = null;
    start() {
      setTimeout(() => {
        this.onerror?.({ error });
        this.onend?.();
      }, 0);
    }
    stop() {
      setTimeout(() => this.onend?.(), 0);
    }
    abort() {
      this.onend?.();
    }
  }
  const w = window as unknown as Record<string, unknown>;
  w.SpeechRecognition = FakeRecognition;
  w.webkitSpeechRecognition = FakeRecognition;
}

function failedStart(name: string, error: string): Story {
  const base = screen('member', 'A conversation', '/messages/thread/', { id: CONVO_ID });
  return {
    ...base,
    name,
    // Before the screen is drawn: a conversation hides the microphone where the browser has no recogniser.
    loaders: [...[base.loaders ?? []].flat(), async () => (standInFor(error), {})],
    play: async ({ canvas, userEvent, globals }) => {
      const locale = (globals as { locale?: string }).locale;
      await userEvent.click(await canvas.findByRole('button', { name: words(locale, 'messages.thread.dictate') }));
    },
  };
}

/** The microphone, or the browser's speech service, was refused. */
export const Blocked: Story = failedStart("Pam can't use the microphone", 'not-allowed');
/** There is no microphone. */
export const NoMic: Story = failedStart("Pam can't find a microphone", 'audio-capture');
/** There is no connection. */
export const Offline: Story = failedStart('Speaking needs a connection', 'network');
/** The browser cannot hear the person's language. */
export const Language: Story = failedStart("The browser can't listen in this language", 'language-not-supported');
/** Any other failure, or one with no code. */
export const Failed: Story = failedStart("The microphone didn't start", 'bad-grammar');
