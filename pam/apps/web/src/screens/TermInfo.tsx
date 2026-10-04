'use client';

import * as stylex from '@stylexjs/stylex';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Popover } from '@astryxdesign/core/Popover';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { GLOSSARY, type GlossaryTerm } from '@pam/config';
import { useI18n } from '@/lib/i18n';

/**
 * A small "i" that explains one of PAM's own words (D-260), from the
 * glossary in `@pam/config` — so a word is defined once, the same way,
 * wherever it is explained. A tap opens it (a popover, not a hover tooltip:
 * phones have no hover); tapping elsewhere closes it. Still a 48px target.
 */
const styles = stylex.create({
  button: { width: '48px', height: '48px', minHeight: '48px', flexShrink: 0 },
  card: { maxWidth: '280px', padding: '16px' },
  term: { fontSize: '17px', fontWeight: 700 },
  definition: { fontSize: '16px', lineHeight: 1.5 },
});

export function TermInfo({ term }: { readonly term: GlossaryTerm }) {
  const { t } = useI18n();
  const entry = GLOSSARY[term];
  const name = t(entry.termKey);
  return (
    <Popover
      placement="below"
      alignment="end"
      content={
        <VStack gap={1} xstyle={styles.card}>
          <Text xstyle={styles.term}>{name}</Text>
          <Text xstyle={styles.definition}>{t(entry.definitionKey)}</Text>
        </VStack>
      }
    >
      <IconButton
        label={t('glossary.whatIs', { term: name.toLowerCase() })}
        variant="ghost"
        icon={<Icon icon="info" size="sm" />}
        xstyle={styles.button}
      />
    </Popover>
  );
}
