'use client';

import { useId, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { TextField } from '@pam/ui';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { useI18n } from '@/lib/i18n';
import { useAreaSearch, type AreaOption } from '@/lib/useAreaSearch';

/**
 * Where the list is measured from, and how a member changes it.
 *
 * Closed, it is a button showing the current area — not a label. A person has
 * to be able to see that this is something they can change without reading
 * anything, which is why the area itself is the control rather than a line of
 * text with a link beside it.
 *
 * Open, it is a plain text input and a list of results. Not a combobox widget:
 * the results are ordinary buttons in a list, each clearing 48px, because this
 * has to work with a screen reader, with a thumb, and at 200% text (§12), and
 * every one of those is easier to get right with real buttons than with a
 * custom listbox.
 *
 * The search is offered as soon as it is opened, with no typing: the ZIP list
 * comes back on an empty query, so somebody who does not know what to type
 * still sees options.
 */

const styles = stylex.create({
  area: {
    minHeight: '48px',
    fontSize: '17px',
    justifyContent: 'flex-start',
    textAlign: 'left',
  },
  change: { minHeight: '48px', fontSize: '17px' },
  hint: { fontSize: '15px', lineHeight: 1.5 },
  privacy: { fontSize: '14px', lineHeight: 1.5 },
  option: {
    minHeight: '48px',
    fontSize: '17px',
    width: '100%',
    justifyContent: 'flex-start',
    textAlign: 'left',
  },
  list: { width: '100%' },
});

export function AreaPicker({
  area,
  onChange,
}: {
  area: AreaOption;
  onChange: (next: AreaOption) => void;
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { options, isSearching } = useAreaSearch(isOpen ? query : '');
  const inputId = useId();

  if (!isOpen) {
    return (
      <HStack gap={2} wrap="wrap" align="center">
        <Button
          label={t('places.showingNear', { area: area.label })}
          variant="secondary"
          onClick={() => {
            setQuery('');
            setIsOpen(true);
          }}
          xstyle={styles.area}
        />
        <Button
          label={t('places.changeArea')}
          variant="ghost"
          onClick={() => {
            setQuery('');
            setIsOpen(true);
          }}
          xstyle={styles.change}
        />
      </HStack>
    );
  }

  return (
    <VStack gap={2}>
      <TextField
        id={inputId}
        label={t('places.areaPrompt')}
        value={query}
        onChange={(next) => setQuery(next)}
        width="100%"
      />
      <Text type="supporting" xstyle={styles.hint}>
        {t('places.areaHint')}
      </Text>

      {/*
        A live region, so a screen reader hears that results changed without the
        focus being yanked out of the input somebody is still typing in.
      */}
      <VStack gap={1} xstyle={styles.list} role="listbox" aria-label={t('places.areaResults')}>
        {options.map((option) => (
          <Button
            key={option.id}
            label={option.label}
            variant="secondary"
            role="option"
            onClick={() => {
              onChange(option);
              setIsOpen(false);
            }}
            xstyle={styles.option}
          />
        ))}
      </VStack>

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
        onClick={() => setIsOpen(false)}
        xstyle={styles.change}
      />
    </VStack>
  );
}
