import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { MenuList, type MenuItem } from '../src/MenuList.js';
import { ChoiceChips } from '../src/ChoiceChips.js';

const icon = <svg width={26} height={26} aria-hidden />;

/**
 * What a row or chip draws, without StyleX's dev-only `data-style-src="file:line"`: it names the source
 * line a style was written on, so it moves whenever a line is added above it and says nothing about the page.
 */
const drawn = (container: HTMLElement) => container.innerHTML.replace(/ data-style-src="[^"]*"/g, '');

/** Rows and chips that carry none of the new props: what the screens drew before them. */
const PLAIN_ROWS: readonly MenuItem[] = [
  { id: 'language', label: 'Language', href: '/language/', value: 'English', icon },
  { id: 'messages', label: 'Message Marcus', href: '/m/', description: 'Hi there', badge: '2', badgeLabel: '2 new messages', hasDot: true, icon },
  { id: 'sign-out', label: 'Sign out', onSelect: () => undefined, icon },
  { id: 'en', label: 'English', isSelected: true, onSelect: () => undefined, icon },
  { id: 'es', label: 'Español', isSelected: false, onSelect: () => undefined, icon },
];

describe('rows and chips without a tag', () => {
  it('draw exactly what they drew before tags existed (a MenuList)', () => {
    const { container } = render(<MenuList label="Settings" items={PLAIN_ROWS} hasDividers />);
    expect(drawn(container)).toMatchSnapshot();
  });

  it('draw exactly what they drew before tags existed (ChoiceChips)', () => {
    const { container } = render(
      <ChoiceChips
        label="Language"
        options={[
          { value: 'en', label: 'English' },
          { value: 'ru', label: 'Русский' },
        ]}
        value="en"
        onChange={() => undefined}
      />,
    );
    expect(drawn(container)).toMatchSnapshot();
  });
});

/** The seven languages as a Language list is drawn: a tag in English, the name in its own language. */
const LANGUAGES: readonly MenuItem[] = [
  { id: 'en', tag: 'EN', lang: 'en', label: 'English', isSelected: true, onSelect: () => undefined, icon },
  { id: 'pt-BR', tag: 'PT-BR', lang: 'pt-BR', label: 'Português', isSelected: false, onSelect: () => undefined, icon },
  { id: 'zh-HK', tag: 'ZH-HK', lang: 'zh-HK', label: '繁體中文', isSelected: false, onSelect: () => undefined, icon },
  { id: 'ru', tag: 'RU', lang: 'ru', label: 'Русский', isSelected: false, onSelect: () => undefined, icon },
  { id: 'ar', tag: 'AR', lang: 'ar', label: 'العربية', isSelected: false, onSelect: () => undefined, icon },
];

describe('a row with a tag', () => {
  it('draws the tag before the label, left to right, and hidden from a screen reader', () => {
    const { container } = render(<MenuList label="Language" items={LANGUAGES} />);
    const tag = screen.getByText('PT-BR');
    expect(tag.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(tag).toHaveAttribute('dir', 'ltr');
    expect(tag.tagName).toBe('BDI'); // an isolate: "PT-BR" cannot be turned round by an Arabic row
    // The tag comes first in the row's own order, then the words.
    const row = tag.closest('li') as HTMLElement;
    const text = row.textContent ?? '';
    expect(text.indexOf('PT-BR')).toBeLessThan(text.indexOf('Português'));
    expect(container.querySelectorAll('[aria-hidden="true"] > bdi[dir="ltr"]')).toHaveLength(LANGUAGES.length);
  });

  it('keeps the language\'s own name as the accessible name, in that language', () => {
    render(<MenuList label="Language" items={LANGUAGES} />);
    // The tag is aria-hidden, so the name is the label alone: "Русский", not "RU Русский".
    const russian = screen.getByText('Русский');
    expect(russian).toHaveAttribute('lang', 'ru');
    expect(russian).toHaveAttribute('dir', 'ltr'); // a language Pam offers always says which way it reads
    expect(screen.queryByRole('button', { name: /RU/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Русский' })).toBeInTheDocument();
    // Arabic reads right to left, and says so.
    const arabic = screen.getByText('العربية');
    expect(arabic).toHaveAttribute('lang', 'ar');
    expect(arabic).toHaveAttribute('dir', 'rtl');
  });

  it('puts lang on the label even when there is no tag, and a tag even when there is no lang', () => {
    render(
      <MenuList
        label="Mixed"
        items={[
          { id: 'a', lang: 'ru', label: 'Русский', onSelect: () => undefined, icon },
          { id: 'b', tag: 'EN', label: 'English', onSelect: () => undefined, icon },
        ]}
      />,
    );
    expect(screen.getByText('Русский')).toHaveAttribute('lang', 'ru');
    expect(screen.getByText('EN').closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByText('English')).not.toHaveAttribute('lang');
  });

  it('draws a tag before the value text, only beside a value, hidden from a screen reader', () => {
    const { rerender } = render(
      <MenuList label="Profile" items={[{ id: 'language', label: 'Language', href: '/language/', value: 'English', valueTag: 'EN', icon }]} />,
    );
    const tag = screen.getByText('EN');
    expect(tag.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(tag).toHaveAttribute('dir', 'ltr');
    expect(screen.getByRole('link', { name: /Language/ })).toBeInTheDocument();
    // A tag with no value to sit before is not drawn.
    rerender(<MenuList label="Profile" items={[{ id: 'language', label: 'Language', href: '/language/', valueTag: 'EN', icon }]} />);
    expect(screen.queryByText('EN')).toBeNull();
  });

  it('has no accessibility violations (structure; contrast and size are the browser run)', async () => {
    const { container } = render(<MenuList label="Language" items={LANGUAGES} hasDividers />);
    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false } },
    });
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
  });
});

describe('a chip with a tag', () => {
  const OPTIONS = [
    { value: 'en', tag: 'EN', lang: 'en', label: 'English' },
    { value: 'ru', tag: 'RU', lang: 'ru', label: 'Русский' },
    { value: 'ar', tag: 'AR', lang: 'ar', label: 'العربية' },
  ];

  it('draws the tag before the words and keeps the name the label, spoken in its own language', () => {
    render(<ChoiceChips label="Language" options={OPTIONS} value="en" onChange={() => undefined} />);
    expect(screen.getByText('RU').closest('[aria-hidden="true"]')).not.toBeNull();
    // Astryx names a button with children from `label` as an aria-label, which takes the language of
    // the element it is on: so `lang` is on the button itself.
    const russian = screen.getByRole('button', { name: 'Русский' });
    expect(russian).toHaveAttribute('lang', 'ru');
    expect(russian).toHaveAttribute('aria-pressed', 'false');
    const arabic = screen.getByRole('button', { name: 'العربية' });
    expect(arabic).toHaveAttribute('lang', 'ar');
    expect(arabic).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('has no accessibility violations (structure)', async () => {
    const { container } = render(<ChoiceChips label="Language" options={OPTIONS} value="ru" onChange={() => undefined} />);
    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false } },
    });
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
  });
});
