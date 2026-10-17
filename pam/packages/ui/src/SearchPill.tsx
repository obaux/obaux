'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import * as stylex from '@stylexjs/stylex';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { pam } from './tokens.stylex.js';
import { Icon } from '@astryxdesign/core/Icon';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { InputGroup, InputGroupText } from '@astryxdesign/core/InputGroup';
import { TextInput } from '@astryxdesign/core/TextInput';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Typeahead, TypeaheadItem } from '@astryxdesign/core/Typeahead';
import { textLinkLook } from './TextLink.js';
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
  /**
   * Words to show in the bar when it first appears, for a search that came back from the address (the public Support
   * search keeps its query in the URL, so Back restores it). The next keystroke replaces them.
   */
  readonly initialQuery?: string;
}

const styles = stylex.create({
  // White under the pill whatever is behind it — a map, on Trips. The theme's
  // own background for the large group loses to the component's (it rendered
  // transparent); set here, it holds.
  group: {
    width: '100%',
    // The same height as the resting launcher, from one token (D-574).
    height: pam['--pam-search-height'],
    minHeight: pam['--pam-search-height'],
    backgroundColor: 'light-dark(#FFFFFF, #262626)',
  },
  // A lighter lift, for a pill that sits inside a sheet rather than on the
  // page: the full shadow there read as a second layer floating over the
  // first (Will, 3 October).
  subtle: {
    boxShadow:
      '0 1px 2px light-dark(oklch(0 0 0 / 5%), oklch(0 0 0 / 30%)), 0 2px 8px light-dark(oklch(0 0 0 / 6%), oklch(0 0 0 / 35%)), inset 0 0 0 1px light-dark(oklch(0 0 0 / 6%), oklch(1 0 0 / 9%))',
  },
  clear: { backgroundColor: 'transparent', borderWidth: 0, paddingInline: 0 },
  // The magnifier-to-words gap of the open `SearchPill`'s field is 4px; this field's is 8px. One gap, so the words start in
  // the same place in every search bar (D-574; Piper, a86).
  fieldGap: { columnGap: '4px', gap: '4px' },
  // The launcher (D-265): the pill itself, as one button — the same white,
  // the same lift, the icon and words centred and bold.
  launcher: {
    width: '100%',
    // The open pill's own height, from the one token both read (D-574) — the button's default 48px otherwise wins over a
    // min-height (Will, 5 October: "these two should match in height").
    height: pam['--pam-search-height'],
    minHeight: pam['--pam-search-height'],
    borderRadius: '999px',
    borderWidth: 0,
    // At rest the magnifier and the words are centred; once tapped they move to the left, where the open field has them
    // (Will, 17 October, a86, reversing 14 October's left-at-rest, D-574). Same 16px/600 and the same 4px gap as the field, so
    // the move is a slide and nothing changes size under the eye.
    justifyContent: 'center',
    gap: '4px',
    fontSize: '16px',
    fontWeight: 600,
    textAlign: 'center',
    color: 'light-dark(#111111, #F2F2F2)',
    backgroundColor: 'light-dark(#FFFFFF, #262626)',
    boxShadow:
      '0 2px 4px light-dark(oklch(0 0 0 / 6%), oklch(0 0 0 / 30%)), 0 10px 28px light-dark(oklch(0 0 0 / 14%), oklch(0 0 0 / 45%)), inset 0 0 0 1px light-dark(oklch(0 0 0 / 5%), oklch(1 0 0 / 10%))',
  },
});

/**
 * The search bar at rest, on a member's Explore (Will, 5 October, D-265: "notice how the search in the reference is … bolder
 * text, center aligned"): one big pill-shaped button, the magnifier and the words centred. A tap opens the field in its place
 * (`SearchBar` below does the whole move).
 */
export function SearchLauncher({
  label,
  onOpen,
  buttonRef,
}: {
  readonly label: string;
  readonly onOpen: () => void;
  readonly buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <Button
      ref={buttonRef}
      label={label}
      variant="secondary"
      icon={<Icon icon="search" size="sm" />}
      onClick={onOpen}
      data-search-launcher=""
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
  initialQuery = '',
}: SearchPillProps<T>) {
  const [query, setQuery] = useState(initialQuery);
  const groupRef = useRef<HTMLDivElement>(null);
  // Words that came back from the address go into the box the way typing puts them there: the input's own value is set
  // and an input event tells the Typeahead, which then reports them. (Its `value` prop would show a chosen token instead.)
  useEffect(() => {
    if (!initialQuery) return;
    const input = groupRef.current?.querySelector('input');
    if (!input) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, initialQuery);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
    <InputGroup ref={groupRef} label={label} isLabelHidden size="lg" xstyle={styles.group}>
      {/* The group's label names the field; its own is left empty, or it is read twice (Iris, case manager P8). */}
      <Typeahead<T>
        key={round}
        label=""
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
  /**
   * Words shown in the empty field. Leave it out when the label already says it: a screen reader would
   * otherwise hear the same name twice, once from the label and once from the placeholder.
   */
  readonly placeholder?: string;
  /**
   * The id of a line that describes the field (a hint under it). An input inside an `InputGroup` cannot
   * take Astryx's own `description`, so the link is made on the input itself.
   */
  readonly describedBy?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Focus it on arrival — Messages' search opens on a tap. */
  readonly hasAutoFocus?: boolean;
  /** A softer shadow — for a pill inside a sheet (the new-message picker). */
  readonly isSubtle?: boolean;
  /**
   * The clear button's name, in the person's language ("Clear search"). Astryx names it "Clear" in English whatever the language,
   * with no prop to change it, so the name is set on the button once it is on screen (Sage, a86).
   */
  readonly clearLabel?: string;
}

export function SearchField({
  label,
  placeholder,
  describedBy,
  value,
  onChange,
  hasAutoFocus = false,
  isSubtle = false,
  clearLabel,
}: SearchFieldProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  // The clear button is there only while the field has words in it.
  useEffect(() => {
    if (!clearLabel) return;
    const button = groupRef.current?.querySelector('button[aria-label]');
    if (button) button.setAttribute('aria-label', clearLabel);
  }, [clearLabel, value]);
  useEffect(() => {
    const input = groupRef.current?.querySelector('input');
    if (!input) return;
    if (describedBy) input.setAttribute('aria-describedby', describedBy);
    else input.removeAttribute('aria-describedby');
  }, [describedBy]);
  // What is typed reads as typed, in any language: an address like "1500 Market" must not be turned into "Market 1500" by the
  // right-to-left page (Lena, a86). `dir="auto"` follows the words' own first strong letter; while the field is empty it is left
  // off, so the placeholder keeps following the page's direction (an empty `auto` field falls back to left to right).
  useEffect(() => {
    const input = groupRef.current?.querySelector('input');
    if (!input) return;
    if (value) input.setAttribute('dir', 'auto');
    else input.removeAttribute('dir');
  }, [value]);
  return (
    <InputGroup ref={groupRef} label={label} isLabelHidden size="lg" xstyle={[styles.group, isSubtle && styles.subtle]}>
      {/*
        Inside an InputGroup the field is named by the group's label AND its own, so the same words
        twice read as "ZIP code or neighborhood ZIP code or neighborhood" (Iris, b20). The group's
        label carries the name; the field's own is left empty.
      */}
      <TextInput
        label=""
        isLabelHidden
        {...(placeholder ? { placeholder } : {})}
        value={value}
        onChange={onChange}
        startIcon="search"
        hasClear
        hasAutoFocus={hasAutoFocus}
        size="lg"
        xstyle={styles.fieldGap}
      />
    </InputGroup>
  );
}

const cancelIn = stylex.keyframes({
  from: { maxWidth: '0px', opacity: 0 },
  to: { maxWidth: '120px', opacity: 1 },
});

const barStyles = stylex.create({
  row: { width: '100%' },
  // The pill takes what Cancel leaves. Once Cancel is there the pill keeps 12px (a spacing token) clear of it, outline counted.
  pill: { flexGrow: 1, minWidth: 0 },
  pillWithCancel: { marginInlineEnd: spacingVars['--spacing-3'] },
  // Cancel draws in over 200ms, so the pill's far edge moves in to make room instead of jumping; with reduced motion it is just there.
  cancel: {
    flexShrink: 0,
    fontSize: '17px',
    fontWeight: 600,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    animationName: { default: null, '@media (prefers-reduced-motion: no-preference)': cancelIn },
    animationDuration: '200ms',
    animationTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  },
});

export interface SearchBarProps {
  /** What the bar is for, read out — "Search programs by name or address". */
  readonly label: string;
  /** The words at rest, and in the empty field. */
  readonly placeholder: string;
  readonly clearLabel: string;
  readonly cancelLabel: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Cancel was tapped: the words are already emptied and the bar is back at rest. */
  readonly onCancel?: () => void;
  /** The bar opened or went back to rest (it also opens by itself when it arrives holding words): a screen makes room for it. */
  readonly onOpenChange?: (isOpen: boolean) => void;
}

/**
 * The one search bar on Explore and the staff All programs (Will, 17 October, a86): at rest a centred pill, the magnifier and the
 * words in the middle; a tap and the pill grows a Cancel on its right and shrinks to make room, while the magnifier and the words
 * slide to the left, where the field has them, ready to type. Same 60px high throughout (one token), so nothing jumps. Cancel
 * empties the words and puts the bar back at rest. It stays open while it holds words, so a screen that comes back to its query
 * comes back open.
 *
 * Reduced motion: no slide, no drawing-in; the bar is simply in its next state.
 */
export function SearchBar({ label, placeholder, clearLabel, cancelLabel, value, onChange, onCancel, onOpenChange }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(value !== '');
  const openChange = useRef(onOpenChange);
  openChange.current = onOpenChange;
  useEffect(() => {
    openChange.current?.(isOpen);
  }, [isOpen]);
  const [tapped, setTapped] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  // Where the magnifier was at rest, to slide it from: read at the tap, used once the field is on screen.
  const slideFrom = useRef<number | null>(null);

  // A query that arrives from outside (Back restoring it) opens the bar without a tap.
  useEffect(() => {
    if (value !== '' && !isOpen) setIsOpen(true);
  }, [value, isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || slideFrom.current === null) return;
    const from = slideFrom.current;
    slideFrom.current = null;
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const group = rowRef.current?.querySelector<HTMLElement>('.astryx-input-group');
    const icon = group?.querySelector<SVGElement>('svg');
    const input = group?.querySelector<HTMLElement>('input');
    if (!group || !icon || !input || typeof icon.animate !== 'function') return;
    const dx = from - icon.getBoundingClientRect().left;
    if (Math.abs(dx) < 1) return;
    // The magnifier and the words travel together, from where they were to where they are; the bar's own edges stay put.
    group.style.overflow = 'hidden';
    const frames = [{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }];
    const timing = { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' };
    const moves = [icon.animate(frames, timing), input.animate(frames, timing)];
    void Promise.all(moves.map((m) => m.finished.catch(() => undefined))).then(() => {
      group.style.overflow = '';
    });
  }, [isOpen]);

  // Escape closes and clears, the same as Cancel, from wherever the focus is in the bar.
  const cancelRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    const row = rowRef.current;
    if (!row || !isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelRef.current();
    };
    row.addEventListener('keydown', onKey);
    return () => row.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const open = () => {
    const icon = launcherRef.current?.querySelector('svg');
    slideFrom.current = icon ? icon.getBoundingClientRect().left : null;
    setTapped(true);
    setIsOpen(true);
  };
  // Cancel (or Escape) removes the focused button and the field; the focus goes to the launcher that takes their place, so a
  // keyboard or screen reader does not land on the page's top.
  const refocus = useRef(false);
  useEffect(() => {
    if (!isOpen && refocus.current) {
      refocus.current = false;
      launcherRef.current?.focus();
    }
  }, [isOpen]);
  const cancel = () => {
    refocus.current = true;
    onChange('');
    setIsOpen(false);
    setTapped(false);
    onCancel?.();
  };
  cancelRef.current = cancel;

  return (
    <HStack ref={rowRef} align="center" wrap="nowrap" xstyle={barStyles.row}>
      <VStack xstyle={[barStyles.pill, isOpen && barStyles.pillWithCancel]}>
        {isOpen ? (
          <SearchField
            label={label}
            placeholder={placeholder}
            clearLabel={clearLabel}
            value={value}
            onChange={onChange}
            hasAutoFocus={tapped}
          />
        ) : (
          <SearchLauncher label={placeholder} onOpen={open} buttonRef={launcherRef} />
        )}
      </VStack>
      {isOpen ? (
        <Button label={cancelLabel} variant="ghost" onClick={cancel} xstyle={[barStyles.cancel, textLinkLook.link]} />
      ) : null}
    </HStack>
  );
}
