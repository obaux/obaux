import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/Stack';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { ABOUT, ABOUT_LANGS, aboutPath, type AboutLang } from '../content/about';

const styles = stylex.create({
  list: { flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0 },
  // A tap target a thumb can hit: the link is padded, not just the letters.
  item: { display: 'inline-flex', minHeight: '44px', alignItems: 'center', paddingInline: '4px' },
});

/**
 * One list of the seven languages, each written in itself. The current one is
 * plain text marked `aria-current`; the others are links to the same page in that
 * language. `languages` is the ones that exist on the site; Storybook passes all
 * seven.
 */
export function LanguageSwitcher({
  current,
  languages = ABOUT_LANGS,
  hrefFor = aboutPath,
}: {
  readonly current: AboutLang;
  readonly languages?: readonly AboutLang[];
  readonly hrefFor?: (lang: AboutLang) => string;
}) {
  return (
    <nav aria-label={ABOUT[current].switcherLabel} lang={current} dir={ABOUT[current].dir}>
      <HStack as="ul" gap={2} xstyle={styles.list}>
        {languages.map((lang) => {
          const t = ABOUT[lang];
          return (
            <li key={lang} {...stylex.props(styles.item)}>
              <span lang={lang} dir={t.dir}>
                {lang === current ? (
                  <Text type="supporting" as="span" aria-current="page">
                    <strong>{t.name}</strong>
                  </Text>
                ) : (
                  <Link href={hrefFor(lang)} hasUnderline>
                    {t.name}
                  </Link>
                )}
              </span>
            </li>
          );
        })}
      </HStack>
    </nav>
  );
}
