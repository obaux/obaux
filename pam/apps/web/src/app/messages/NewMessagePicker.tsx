'use client';

import { useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { TextInput } from '@astryxdesign/core/TextInput';
import { List, ListItem } from '@astryxdesign/core/List';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { useI18n } from '@/lib/i18n';

/**
 * Who to message — a sheet that slides up over the list (D-186).
 *
 * Everyone `messageable_people()` returns (or, for a preview, the example
 * cast), with a search box on top that narrows the rows as you type. On a
 * phone this is a `BottomSheet` rather than a dropdown: a dropdown under a
 * field is a desktop shape, and a sheet gives the list the whole screen and
 * the keyboard room (`height="tall"`). Astryx's `Typeahead` was the other
 * candidate; it is a single-value combobox for a form field, and what this
 * needs is a list somebody taps a row in, not a value that lands in a field.
 *
 * Matching is a normalised substring — accents stripped, case folded — over
 * the name and the context line. The list is small (a caseload, a program's
 * members, a member's own staff), so nothing fuzzier is warranted, and
 * nothing is downloaded for it.
 *
 * `onPick` does the real work — `open_direct_conversation()` for a real
 * person, the example thread for a dummy one — and returns where to go.
 * Rows are 48px through the list's density and stated below.
 */
export interface PickablePerson {
  readonly id: string;
  readonly name: string;
  readonly context: string | null;
}

const styles = stylex.create({
  // Clear of the sheet's grab handle: the first thing in the sheet used to sit
  // under it (Will's screenshot, 21 September).
  body: { width: '100%', paddingBlockStart: spacingVars['--spacing-6'], paddingBlockEnd: spacingVars['--spacing-2'] },
  item: { minHeight: '48px' },
  none: { fontSize: '17px', paddingBlock: '12px' },
});

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function NewMessagePicker({
  isOpen,
  onOpenChange,
  people,
  onPick,
}: {
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly people: readonly PickablePerson[];
  readonly onPick: (id: string) => Promise<string | null>;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const shown = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return people;
    return people.filter((p) => fold(p.name).includes(q) || (p.context ? fold(p.context).includes(q) : false));
  }, [people, query]);

  const pick = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    setFailed(false);
    const href = await onPick(id);
    setBusyId(null);
    if (!href) {
      setFailed(true);
      return;
    }
    window.location.assign(href);
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange} label={t('messages.new.title')} height="tall">
      <VStack gap={3} xstyle={styles.body}>
        <TextInput
          label={t('messages.new.search')}
          isLabelHidden
          placeholder={t('messages.new.search')}
          value={query}
          onChange={setQuery}
          hasClear
          hasAutoFocus
          startIcon="search"
          width="100%"
        />
        {failed ? (
          <Text type="supporting" xstyle={styles.none}>
            {t('messages.start.failed.body')}
          </Text>
        ) : null}
        {shown.length === 0 ? (
          <Text type="supporting" xstyle={styles.none}>
            {people.length === 0 ? t('messages.start.empty.body') : t('messages.new.none')}
          </Text>
        ) : (
          <List hasDividers density="spacious">
            {shown.map((p) => (
              <ListItem
                key={p.id}
                label={p.name}
                description={p.context ?? undefined}
                startContent={<Avatar size="md" name={p.name} />}
                isDisabled={busyId !== null && busyId !== p.id}
                onClick={() => void pick(p.id)}
              />
            ))}
          </List>
        )}
      </VStack>
    </BottomSheet>
  );
}
