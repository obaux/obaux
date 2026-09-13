import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import type { SpeechRecognizer } from '@pam/ui';

/**
 * The native speech recogniser, shaped to the `SpeechRecognizer` interface
 * `VoiceInput` accepts (§1, §2.4).
 *
 * Keeping the platform detail here rather than inside VoiceInput means the
 * component stays testable in jsdom and the web build never pulls in Capacitor.
 */
export const nativeSpeechRecognizer: SpeechRecognizer = {
  async isAvailable() {
    try {
      const { available } = await SpeechRecognition.available();
      if (!available) return false;

      // Permission is requested lazily, on the first tap, not at startup — a
      // permission prompt before the member has seen why is a prompt they deny.
      const status = await SpeechRecognition.checkPermissions();
      return status.speechRecognition !== 'denied';
    } catch {
      return false;
    }
  },

  async start({ language }) {
    const status = await SpeechRecognition.checkPermissions();
    if (status.speechRecognition !== 'granted') {
      const requested = await SpeechRecognition.requestPermissions();
      if (requested.speechRecognition !== 'granted') return '';
    }

    const { matches } = await SpeechRecognition.start({
      language,
      maxResults: 1,
      partialResults: false,
      popup: false,
    });

    return matches?.[0] ?? '';
  },

  async stop() {
    await SpeechRecognition.stop();
  },
};
