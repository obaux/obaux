import { HowTo } from './HowTo';
import { Needs } from './Needs';
import { Body, Lead, P, Section } from './Prose';
import { RULES } from '../content/rules';
import type { AboutLang } from '../content/about';

/** Pictures of the member's signing screens. English only: their words are English, and the other six languages have no signed picture words. */
const SIGNING_SHOTS = [
  {
    name: 'signing-a-programs-rules/place-policies.png',
    alt: 'The “Policies to sign” screen for an example program: “0 of 4 signed”, four policies that each say “Needs your signature”, and a button that says “Start signing”.',
    caption: '“Policies to sign”, for an example program.',
  },
  {
    name: 'signing-a-programs-rules/place-policy.png',
    alt: 'One policy, “Confidentiality and disclosure”, marked “Policy 1 of 4”, with its words in a card and a button at the bottom that says “Sign”.',
    caption: 'A policy, for an example program.',
  },
] as const;

/** The text of "Signing a program's rules" in one language: the lead, then its sections. */
export function RulesBody({ lang }: { readonly lang: AboutLang }) {
  const t = RULES[lang];
  return (
    <Body>
      <Lead>{t.lead}</Lead>
      {t.sections.map((section) =>
        section.note ? (
          <Needs key={section.title} title={section.title}>
            {section.paras.join(' ')}
          </Needs>
        ) : (
        <Section key={section.title} title={section.title}>
          {section.steps ? <HowTo steps={section.steps} title={t.howTo} {...(lang === 'en' ? { shots: [...SIGNING_SHOTS] } : {})} /> : null}
          {section.paras.map((para) => (
            <P key={para}>{para}</P>
          ))}
        </Section>
        ),
      )}
    </Body>
  );
}
