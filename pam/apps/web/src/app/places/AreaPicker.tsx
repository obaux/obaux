'use client';

import { useId, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { AreaChip, TextField } from '@pam/ui';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { useI18n } from '@/lib/i18n';
import { useAreaSearch, type AreaOption } from '@/lib/useAreaSearch';

/**
 * Where the list is measured from, and how a member changes it.
 *
 * Two pieces, because they live in two places (Will, 13 September). Closed, it
 * is a chip in the header — the area and a pencil, out of the way of the list.
 * Open, it is a search panel directly under that header, where the input lands
 * next to the thing that opened it.
 *
 * The panel is a plain text input and a list of results, not a combobox widget:
 * the results are ordinary buttons, each clearing 48px, because this has to
 * work with a screen reader, with a thumb, and at 200% text (§12), and every
 * one of those is easier to get right with real buttons than with a custom
 * listbox.
 *
 * The search is offered as soon as it opens, with no typing: the ZIP list comes
 * back on an empty query, so somebody who does not know what to type still sees
 * options.
 *
 * The page owns `isOpen` rather than this file, because the two pieces are on
 * opposite sides of the header and both have to agree about it.
 */

const styles = stylex.create({
  hint: { fontSize: '15px', lineHeight: 1.5 },
  privacy: { fontSize: '14px', lineHeight: 1.5 },
  cancel: { minHeight: '48px', fontSize: '17px' },
  option: {
    minHeight: '48px',
    fontSize: '17px',
    width: '100%',
    justifyContent: 'flex-start',
    textAlign: 'left',
  },
  list: { width: '100%' },
});

/** The header piece: where we are measuring from, and the way to change it. */
export function AreaTrigger({ area, onOpen }: { area: AreaOption; onOpen: () => void }) {
  const { t } = useI18n();
  const near = t('places.near', { area: area.label });

  return (
    <AreaChip
      label={near}
      // The same formatted string the visible text uses ("Near City Hall"),
      // not the bare area name — so the accessible name actually contains
      // what a sighted person reads on the chip, word for word.
      changeLabel={t('places.changeArea', { area: near })}
      onChange={onOpen}
    />
  );
}

/** The panel under the header: type an area, pick one. */
export function AreaSearch({
  onChange,
  onClose,
}: {
  onChange: (next: AreaOption) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const { options, isSearching } = useAreaSearch(query);
  const inputId = useId();

  return (
    <VStack gap={2}>
      {/*
        The label is the two words that say what to type. It used to be a
        question — "Where are you staying now?" — which is the right thing to
        ask during onboarding and the wrong thing to put over a field somebody
        opened on purpose, knowing exactly what it is for.
      */}
      <TextField
        id={inputId}
        purpose="address"
        label={t('places.areaLabel')}
        value={query}
        onChange={(next) => setQuery(next)}
        width="100%"
      />
      <Text type="supporting" xstyle={styles.hint}>
        {t('places.areaHint')}
      </Text>

      <VStack gap={1} xstyle={styles.list} role="listbox" aria-label={t('places.areaResults')}>
        {options.map((option) => (
          <Button
            key={option.id}
            label={option.label}
            variant="secondary"
            role="option"
            onClick={() => {
              onChange(option);
              onClose();
            }}
            xstyle={styles.option}
          />
        ))}
      </VStack>

      {/*
        A live region, so a screen reader hears that results changed without the
        focus being yanked out of the input somebody is still typing in.
      */}
      <div role="status" aria-live="polite">
        {isSearching && options.length === 0 ? (
          <Text type="supporting" xstyle={styles.hint}>
            {t('places.areaSearching')}
          </Text>
        ) : null}
        {!isSearching && options.length === 0 ? (
          <Text type="supporting" xstyle={styles.hint}>
            {t('places.areaNone')}
          </Text>
        ) : null}
      </div>

      <Text type="supporting" xstyle={styles.privacy}>
        {t('places.areaPrivacy')}
      </Text>

      <Button
        label={t('places.areaCancel')}
        variant="ghost"
        onClick={onClose}
        xstyle={styles.cancel}
      />
    </VStack>
  );
}
