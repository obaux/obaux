import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ABOUT, ABOUT_ART, type AboutLang } from '../content/about';
import { Frame } from '../components/Frame';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Lead, ReadMore } from '../components/Prose';

const styles = stylex.create({
  art: { width: '100%', height: 'auto', display: 'block', borderRadius: '16px', aspectRatio: '8 / 3' },
  page: { display: 'block' },
});

/**
 * About Pam, in one language. The wrapper carries `lang` and `dir` itself, so
 * Storybook (which has no `<html>` of its own to set) shows the right direction
 * and the right font choices; on the site the document says the same.
 * `languages` is the ones the switcher offers; `draft` adds the banner.
 */
export function AboutScreen({
  lang,
  languages,
  hrefFor,
  draft = false,
}: {
  readonly lang: AboutLang;
  readonly languages?: readonly AboutLang[];
  readonly hrefFor?: (lang: AboutLang) => string;
  readonly draft?: boolean;
}) {
  const t = ABOUT[lang];
  return (
    <section lang={t.lang} dir={t.dir} {...stylex.props(styles.page)}>
      <Frame width="wide" gap={6}>
        {draft ? (
          <Banner
            status="warning"
            title={
              lang === 'en'
                ? 'Draft: Will signs the English before this goes live. Not on the site yet.'
                : 'Draft: written to learn from, no native reader yet. Not on the site.'
            }
          />
        ) : null}
        <VStack gap={3} paddingBlockStart={8} maxWidth={720}>
          <LanguageSwitcher current={lang} languages={languages} hrefFor={hrefFor} />
          <Heading level={1}>{t.title}</Heading>
        </VStack>
        <img src={ABOUT_ART.wide} alt={t.artAlt} width={1600} height={600} {...stylex.props(styles.art)} />
        <VStack gap={8} maxWidth={720}>
          <Lead>{t.lead}</Lead>
          <VStack gap={3}>
            <Heading level={2}>{t.whyTitle}</Heading>
            <Text as="p">{t.why}</Text>
          </VStack>
          <VStack gap={3}>
            <Heading level={2}>{t.todayTitle}</Heading>
            <VStack as="ul" role="list" gap={3}>
              {t.today.map((item) => (
                <li key={item.title}>
                  <Card padding={4} variant="muted">
                    <VStack gap={1}>
                      <Heading level={3}>{item.title}</Heading>
                      <Text as="p">{item.body}</Text>
                    </VStack>
                  </Card>
                </li>
              ))}
            </VStack>
          </VStack>
          <VStack gap={3}>
            <Heading level={2}>{t.comingTitle}</Heading>
            <Text as="p">{t.coming}</Text>
          </VStack>
          <VStack gap={3}>
            <Heading level={2}>{t.helpTitle}</Heading>
            <Text as="p">{t.help}</Text>
            <ReadMore label={t.helpLink} href="/support/" />
          </VStack>
        </VStack>
      </Frame>
    </section>
  );
}
