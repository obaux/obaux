'use client';

import { useEffect, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Icon } from '@astryxdesign/core/Icon';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { InputGroup, InputGroupText } from '@astryxdesign/core/InputGroup';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Typeahead, TypeaheadItem } from '@astryxdesign/core/Typeahead';
import type { SearchableItem, SearchSource } from '@astryxdesign/core/Typeahead';

/**
 * The search bar at the top of Explore and the staff homes (D-212).
 *
 * Modelled on the reference Will gave (1 October): one large rounded bar,
 * lifted off the page by a shadow, the first thing on the screen. What it
 * does, in the order a person meets it:
 *
 *   - **Suggestions while typing.** From the first letter, a list drops down
 *     under the bar: each row is a name, and under it the address (or what
 *     else the caller says) — so typing "Broad" finds the program on Broad
 *     Street even though "Broad" is not in its name, and shows why it
 *     matched. Picking one goes straight there (`onPick`).
 *   - **The list underneath follows the words** (`onQuery`), so somebody who
 *     ignores the suggestions still sees what they asked for.
 *   - **Clear** — an × inside the bar whenever there is anything in it. One
 *     tap empties it, closes the suggestions and puts the cursor back. Astryx's
 *     own clear button only appears once a suggestion has been picked; here
 *     nothing is ever "picked" and kept, so the bar draws its own.
 */
export interface SearchPillItem extends SearchableItem {
  /** The second line of a suggestion: an address, or what kind of person. */
  readonly description?: string;
}

export interface SearchPillProps<T extends SearchPillItem> {
  /** What the bar is for, read out — "Search programs by name or address". */
  readonly label: string;
  readonly placeholder: string;
  readonly searchSource: SearchSource<T>;
  /** A suggestion was chosen. */
  readonly onPick: (item: T) => void;
  /** The words in the bar changed (every letter; debounce at the caller). */
  readonly onQuery: (query: string) => void;
  /** Shown in the dropdown when nothing matches. */
  readonly emptyText: string;
  /** The clear button's name — "Clear search". */
  readonly clearLabel: string;
  /** Drawn at the start of each suggestion — a category icon, an avatar. */
  readonly itemIcon?: (item: T) => ReactNode;
  /**
   * Change it to empty the bar from outside — the "Clear search" button in
   * the screen's empty state. The bar then reports `onQuery('')` itself.
   */
  readonly clearSignal?: number;
  /** Focus it on arrival — after the centred launcher was tapped (D-265). */
  readonly hasAutoFocus?: boolean;
}

const styles = stylex.create({
  // White under the pill whatever is behind it — a map, on Trips. The theme's
  // own background for the large group loses to the component's (it rendered
  // transparent); set here, it holds.
  group: { width: '100%', backgroundColor: 'light-dark(#FFFFFF, #262626)' },
  // A lighter lift, for a pill that sits inside a sheet rather than on the
  // page: the full shadow there read as a second layer floating over the
  // first (Will, 3 October).
  subtle: {
    boxShadow:
      '0 1px 2px light-dark(oklch(0 0 0 / 5%), oklch(0 0 0 / 30%)), 0 2px 8px light-dark(oklch(0 0 0 / 6%), oklch(0 0 0 / 35%)), inset 0 0 0 1px light-dark(oklch(0 0 0 / 6%), oklch(1 0 0 / 9%))',
  },
  clear: { backgroundColor: 'transparent', borderWidth: 0, paddingInline: 0 },
  // The launcher (D-265): the pill itself, as one button — the same white,
  // the same lift, the icon and words centred and bold.
  launcher: {
    width: '100%',
    // The open pill's own height (the large input group, 60px) — the
    // button's default 48px otherwise wins over a min-height (Will,
    // 5 October: "these two should match in height").
    height: '60px',
    minHeight: '60px',
    borderRadius: '999px',
    borderWidth: 0,
    gap: '10px',
    fontSize: '18px',
    fontWeight: 600,
    color: 'light-dark(#111111, #F2F2F2)',
    backgroundColor: 'light-dark(#FFFFFF, #262626)',
    boxShadow:
      '0 2px 4px light-dark(oklch(0 0 0 / 6%), oklch(0 0 0 / 30%)), 0 10px 28px light-dark(oklch(0 0 0 / 14%), oklch(0 0 0 / 45%)), inset 0 0 0 1px light-dark(oklch(0 0 0 / 5%), oklch(1 0 0 / 10%))',
  },
});

/**
 * The search bar at rest, on a member's Explore (Will, 5 October, D-265:
 * "notice how the search in the reference is … bolder text, center
 * aligned"): one big pill-shaped button, magnifier and words centred. A tap
 * opens the real `SearchPill` in its place, focused, with Cancel beside it.
 */
export function SearchLauncher({ label, onOpen }: { readonly label: string; readonly onOpen: () => void }) {
  return (
    <Button
      label={label}
      variant="secondary"
      icon={<Icon icon="search" size="md" />}
      onClick={onOpen}
      xstyle={styles.launcher}
    />
  );
}

export function SearchPill<T extends SearchPillItem>({
  label,
  placeholder,
  searchSource,
  onPick,
  onQuery,
  emptyText,
  clearLabel,
  itemIcon,
  clearSignal = 0,
  hasAutoFocus = false,
}: SearchPillProps<T>) {
  const [query, setQuery] = useState('');
  // The Typeahead keeps its own text; a fresh one is the only clean way to
  // empty it. `round` > 0 also means "focus it", so clearing keeps the cursor.
  const [round, setRound] = useState(0);

  const change = (next: string) => {
    setQuery(next);
    onQuery(next);
  };

  useEffect(() => {
    if (clearSignal === 0) return;
    setRound((n) => n + 1);
    setQuery('');
    onQuery('');
    // Only a new signal clears; `onQuery` changing identity must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSignal]);

  return (
    <InputGroup label={label} isLabelHidden size="lg" xstyle={styles.group}>
      <Typeahead<T>
        key={round}
        label={label}
        isLabelHidden
        placeholder={placeholder}
        searchSource={searchSource}
        value={null}
        onChange={(item) => {
          if (item) onPick(item);
        }}
        onChangeQuery={change}
        renderItem={(item) => (
          <TypeaheadItem
            item={item}
            {...(item.description ? { description: item.description } : {})}
            {...(itemIcon ? { icon: itemIcon(item) } : {})}
          />
        )}
        startIcon="search"
        hasClear={false}
        hasAutoFocus={hasAutoFocus || round > 0}
        maxMenuItems={6}
        debounceMs={120}
        emptySearchResultsText={emptyText}
        size="lg"
      />
      {query ? (
        <InputGroupText xstyle={styles.clear}>
          <IconButton
            label={clearLabel}
            icon={<Icon icon="close" size="md" />}
            variant="ghost"
            onClick={() => {
              setRound((n) => n + 1);
              change('');
            }}
          />
        </InputGroupText>
      ) : null}
    </InputGroup>
  );
}

/**
 * The same pill, for filtering a list that is already on screen — Trips'
 * places, Messages' names (D-216). No suggestions to drop down: the list
 * below is the answer. Its own clear button empties it.
 */
export interface SearchFieldProps {
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Focus it on arrival — Messages' search opens on a tap. */
  readonly hasAutoFocus?: boolean;
  /** A softer shadow — for a pill inside a sheet (the new-message picker). */
  readonly isSubtle?: boolean;
}

export function SearchField({
  label,
  placeholder,
  value,
  onChange,
  hasAutoFocus = false,
  isSubtle = false,
}: SearchFieldProps) {
  return (
    <InputGroup label={label} isLabelHidden size="lg" xstyle={[styles.group, isSubtle && styles.subtle]}>
      <TextInput
        label={label}
        isLabelHidden
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        startIcon="search"
        hasClear
        hasAutoFocus={hasAutoFocus}
        size="lg"
      />
    </InputGroup>
  );
}
