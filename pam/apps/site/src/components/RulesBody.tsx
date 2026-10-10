import { Body, Lead, P, Section } from './Prose';
import { Steps } from './Steps';
import { RULES } from '../content/rules';
import type { AboutLang } from '../content/about';

/** The text of "Signing a program's rules" in one language: the lead, then its sections. */
export function RulesBody({ lang }: { readonly lang: AboutLang }) {
  const t = RULES[lang];
  return (
    <Body>
      <Lead>{t.lead}</Lead>
      {t.sections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.steps ? <Steps items={section.steps} /> : null}
          {section.paras.map((para) => (
            <P key={para}>{para}</P>
          ))}
        </Section>
      ))}
    </Body>
  );
}
