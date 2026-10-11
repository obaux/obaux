/**
 * Every `--color-*` token the theme defines, read from the theme's own CSS (`@pam/ui/theme/pam.css`) so the
 * Colour page lists what is there and cannot drift from it (D-504: Foundations named about fifteen colours; the
 * theme defines 131).
 */
export interface ColourToken {
  readonly name: string;
  /** The light value, as written (`#FFFFFF`, `oklch(...)`, `var(--x)`). */
  readonly light: string;
  /** The dark value; the same as light when the token is one value for both modes. */
  readonly dark: string;
  /** The family it is listed under: its first word after `--color-`. */
  readonly group: string;
}

/** Splits `a, b` at the comma that is not inside brackets. */
function splitTop(text: string): [string, string] | null {
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '(') depth += 1;
    else if (c === ')') depth -= 1;
    else if (c === ',' && depth === 0) return [text.slice(0, i).trim(), text.slice(i + 1).trim()];
  }
  return null;
}

export function parseColourTokens(css: string): ColourToken[] {
  const found = new Map<string, ColourToken>();
  for (const match of css.matchAll(/^\s*(--color-[a-z0-9-]+):\s*([^;]+);/gm)) {
    const name = match[1]!;
    const value = match[2]!.trim();
    const pair = value.startsWith('light-dark(') && value.endsWith(')') ? splitTop(value.slice('light-dark('.length, -1)) : null;
    const [light, dark] = pair ?? [value, value];
    // The first definition wins: a later rule that re-points a token for one component is not the token.
    if (!found.has(name)) {
      found.set(name, { name, light, dark, group: name.slice('--color-'.length).split('-')[0]! });
    }
  }
  return [...found.values()];
}
