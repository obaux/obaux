import { Banner } from '@astryxdesign/core/Banner';
import { Heading } from '@astryxdesign/core/Heading';
import { VStack } from '@astryxdesign/core/VStack';
import { ABOUT, ABOUT_LANGS, type AboutLang } from '../content/about';
import { RULES, rulesPath } from '../content/rules';
import { Frame } from '../components/Frame';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { RulesBody } from '../components/RulesBody';

/**
 * "Signing a program's rules" in one language other than English. Like About Pam's page, it carries
 * its own `lang` and `dir`, a language list (English links to the Support post) and, in Storybook, a
 * Draft banner.
 */
export function RulesScreen({
  lang,
  languages = ABOUT_LANGS,
  draft = false,
}: {
  readonly lang: AboutLang;
  readonly languages?: readonly AboutLang[];
  readonly draft?: boolean;
}) {
  const t = RULES[lang];
  const meta = ABOUT[lang];
  return (
    <section lang={meta.lang} dir={meta.dir}>
      <Frame width="wide" gap={6}>
        {draft ? (
          <Banner status="warning" title="Draft: written to learn from, no native reader yet. Held until members can really sign. Not on the site." />
        ) : null}
        <VStack gap={3} paddingBlockStart={8} maxWidth={720}>
          <LanguageSwitcher current={lang} languages={languages} hrefFor={rulesPath} />
          <Heading level={1}>{t.title}</Heading>
        </VStack>
        <RulesBody lang={lang} />
      </Frame>
    </section>
  );
}
