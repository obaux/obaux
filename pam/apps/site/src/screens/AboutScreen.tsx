import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ABOUT, ABOUT_ART, type AboutLang } from '../content/about';
import { WebFrame } from '../components/WebFrame';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Lead, ReadMore } from '../components/Prose';

const styles = stylex.create({
  art: { width: '100%', height: 'auto', display: 'block', borderRadius: '24px', aspectRatio: '8 / 3', objectFit: 'cover' },
  // The grey page of the design (Figma "About Pam"): text in a 720 column under a 1048 picture.
  page: { display: 'block', backgroundColor: website['--website-surface-muted'], color: website['--website-text-primary'], paddingBlockEnd: '64px' },
  title: { color: website['--website-text-primary'], margin: 0 },
  h2: { color: website['--website-text-primary'], margin: 0 },
  text: { color: website['--website-text-primary'], margin: 0 },
  row: {
    paddingBlock: '16px',
    borderBlockEndWidth: '1px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: website['--website-border-strong'],
  },
  rowTitle: { color: website['--website-text-primary'], margin: 0 },
  list: { borderBlockStartWidth: '1px', borderBlockStartStyle: 'solid', borderBlockStartColor: website['--website-border-strong'], listStyle: 'none', margin: 0, padding: 0 },
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
    <section lang={t.lang} dir={t.dir} data-page="about" {...stylex.props(styles.page)}>
      <WebFrame gap={6}>
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
          <Heading level={1} xstyle={[type.heading_title35, styles.title]}>{t.title}</Heading>
        </VStack>
        <img src={ABOUT_ART.wide} alt={t.artAlt} width={1600} height={600} {...stylex.props(styles.art)} />
        <VStack gap={8} maxWidth={720}>
          <Lead>{t.lead}</Lead>
          <VStack gap={3}>
            <Heading level={2} xstyle={[type.heading_title24, styles.h2]}>{t.whyTitle}</Heading>
            <Text as="p" xstyle={styles.text}>{t.why}</Text>
          </VStack>
          <VStack gap={3}>
            <Heading level={2} xstyle={[type.heading_title24, styles.h2]}>{t.todayTitle}</Heading>
            <VStack as="ul" role="list" xstyle={styles.list}>
              {t.today.map((item) => (
                <li key={item.title}>
                  <VStack gap={1} xstyle={styles.row}>
                    <Heading level={3} xstyle={[type.heading_small17, styles.rowTitle]}>{item.title}</Heading>
                    <Text as="p" xstyle={styles.text}>{item.body}</Text>
                  </VStack>
                </li>
              ))}
            </VStack>
          </VStack>
          <VStack gap={3}>
            <Heading level={2} xstyle={[type.heading_title24, styles.h2]}>{t.comingTitle}</Heading>
            <Text as="p" xstyle={styles.text}>{t.coming}</Text>
          </VStack>
          <VStack gap={3}>
            <Heading level={2} xstyle={[type.heading_title24, styles.h2]}>{t.helpTitle}</Heading>
            <Text as="p" xstyle={styles.text}>{t.help}</Text>
            <ReadMore label={t.helpLink} href="/support/" />
          </VStack>
        </VStack>
      </WebFrame>
    </section>
  );
}
