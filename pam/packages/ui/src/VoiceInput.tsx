import { useCallback, useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';

/**
 * A text field with a microphone (§0, §2.4).
 *
 * "Every text input has a microphone button." Typing on a phone keyboard is a
 * real barrier for members with low literacy or limited phone experience, so
 * speech is a first-class path, not an accessibility afterthought.
 *
 * Web uses the Web Speech API. Native uses
 * `@capacitor-community/speech-recognition`, injected via `recognizer` so this
 * component stays platform-free. When neither is available the mic is hidden
 * entirely (§1) — a dead button is worse than no button.
 */
export interface SpeechRecognizer {
  isAvailable: () => Promise<boolean> | boolean;
  start: (options: { language: string }) => Promise<string>;
  stop?: () => Promise<void> | void;
}

export interface VoiceInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** BCP-47 tag for speech recognition, e.g. "en-US" or "es-US". */
  language?: string;
  /**
   * Astryx TextInput supports 'text' | 'password' | 'email' only. Phone entry
   * (§10 step 4) needs a numeric keypad and E.164 formatting, so it gets a
   * dedicated PhoneInput in Phase 1 rather than a `tel` type here — see
   * DECISIONS.md D-009.
   */
  type?: 'text' | 'email';
  description?: string;
  isRequired?: boolean;
  /** Localised accessible names for the mic control. */
  micLabels: { start: string; listening: string };
  /** Platform recognizer. Omit on web to use the Web Speech API. */
  recognizer?: SpeechRecognizer;
}

const styles = stylex.create({
  row: { width: '100%', alignItems: 'flex-end' },
  input: { flexGrow: 1, fontSize: '18px' },
  // §2.5 — the mic is a real target, not a decorative glyph.
  mic: { minWidth: '48px', minHeight: '48px' },
});

/** Minimal shape of the Web Speech API we depend on. */
interface WebSpeechEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface WebSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: WebSpeechEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function getWebSpeechConstructor(): (new () => WebSpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = w['SpeechRecognition'] ?? w['webkitSpeechRecognition'];
  // Normalise undefined to null. An earlier version returned `undefined` and
  // compared it with `!== null`, which showed a mic button on every browser
  // without the Web Speech API — a control that looked live and did nothing.
  // §1 is explicit: hide the mic if unsupported.
  return typeof ctor === 'function' ? (ctor as new () => WebSpeechRecognition) : null;
}

export function VoiceInput({
  label,
  value,
  onChange,
  language = 'en-US',
  type = 'text',
  description,
  isRequired = false,
  micLabels,
  recognizer,
}: VoiceInputProps) {
  const [micAvailable, setMicAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const activeRef = useRef<WebSpeechRecognition | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const available = recognizer
        ? await recognizer.isAvailable()
        : getWebSpeechConstructor() !== null;
      if (!cancelled) setMicAvailable(Boolean(available));
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, [recognizer]);

  // Stop a live recognition if the component unmounts mid-listen, so the mic
  // indicator does not stay lit after the screen is gone.
  useEffect(() => {
    return () => {
      activeRef.current?.stop();
      void recognizer?.stop?.();
    };
  }, [recognizer]);

  const listen = useCallback(async () => {
    if (listening) {
      activeRef.current?.stop();
      await recognizer?.stop?.();
      setListening(false);
      return;
    }

    setListening(true);

    try {
      if (recognizer) {
        const transcript = await recognizer.start({ language });
        if (transcript) onChange(transcript);
        setListening(false);
        return;
      }

      const Recognition = getWebSpeechConstructor();
      if (!Recognition) {
        setListening(false);
        return;
      }

      const recognition = new Recognition();
      activeRef.current = recognition;
      recognition.lang = language;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) onChange(transcript);
      };
      // A failed recognition is silent by design: the member still has the
      // keyboard, and an error toast here would just be one more thing to read.
      recognition.onerror = () => setListening(false);
      recognition.onend = () => {
        setListening(false);
        activeRef.current = null;
      };

      recognition.start();
    } catch {
      setListening(false);
    }
  }, [listening, language, onChange, recognizer]);

  return (
    <HStack gap={2} xstyle={styles.row}>
      <TextInput
        label={label}
        type={type}
        value={value}
        onChange={(next) => onChange(next)}
        description={description}
        isRequired={isRequired}
        xstyle={styles.input}
      />
      {micAvailable ? (
        <IconButton
          // `icon` takes a ReactNode, not an icon name. A bare string is a
          // valid ReactNode, so passing 'microphone' typechecks and then
          // renders the literal word next to the button.
          icon={<Icon icon={listening ? 'stop' : 'microphone'} />}
          label={listening ? micLabels.listening : micLabels.start}
          variant={listening ? 'primary' : 'secondary'}
          aria-pressed={listening}
          clickAction={() => void listen()}
          xstyle={styles.mic}
        />
      ) : null}
    </HStack>
  );
}
