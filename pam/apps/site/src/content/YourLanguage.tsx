import { Body, Lead, P, Section } from '../components/Prose';
import { HowTo } from '../components/HowTo';

/**
 * Support post: Using Pam in your language (everyone). Words by Sage, signed by Will (card a51, 11 October 2026).
 * The seven languages are the app's (`language.*`, A24); each is written in its own language, as the app does.
 * Deliberately no line about texts: texts to members are not switched on yet (`texts_live` off, D-481) and the
 * sign-in code comes from the provider's own template. Add "The texts Pam sends you come in your language too"
 * the day texts go live, if the code text follows. The lead is shorter than the app's `language.intro` for the
 * same reason (a FINDING for Lena).
 */
export function YourLanguage() {
  return (
    <Body>
      <Lead>Pam’s words and buttons will be in the language you choose.</Lead>

      <Section title="The languages">
        <P>English · Español · Português (Brasil) · 简体中文（普通话） · 繁體中文（廣東話） · Русский · العربية</P>
      </Section>

      <Section title="Pick it when you join" short="Pick when you join">
        <P>One of the first screens asks you to choose a language.</P>
      </Section>

      <Section title="Change it any time" short="Change it">
        <HowTo steps={['Open Profile, then tap Language.', 'Pick yours. Pam changes straight away.']} />
      </Section>

      <Section title="What follows your choice" short="What changes">
        <P>Every screen in the app.</P>
      </Section>

      <Section title="Good to know">
        <P>These Support pages are in English for now.</P>
        <P>If a word in your language looks wrong, contact Pam and tell us. We fix it.</P>
      </Section>
    </Body>
  );
}
