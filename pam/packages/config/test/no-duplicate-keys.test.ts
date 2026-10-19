import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * No language file, and not the ledger, has a key twice in the same object.
 *
 * `JSON.parse` keeps the last of two equal keys and says nothing, so every other test sees one key with one value and passes. The
 * two copies are two edits that both added the key (a merge that took both sides, 19 October: seven `appError.action.*` names in
 * `en.json`), and the file that results is wrong even when the values agree: the next person to change one copy changes nothing,
 * and any tool that rewrites the file drops the other. So this reads the raw text, not the parsed object.
 */
const DIR = fileURLToPath(new URL('../src/locales/', import.meta.url));

/** Every key that appears twice in one object of `raw`, as `path › key` (the path is the keys of the enclosing objects). */
function duplicateKeys(raw: string): string[] {
  const found: string[] = [];
  // One entry per open `{` (the keys seen so far in it) or `[` (null).
  const open: Array<Set<string> | null> = [];
  const path: string[] = [];
  let lastKey = '';
  let i = 0;
  while (i < raw.length) {
    const c = raw[i]!;
    if (c === '"') {
      let j = i + 1;
      while (raw[j] !== '"') j += raw[j] === '\\' ? 2 : 1;
      const text = raw.slice(i + 1, j);
      let k = j + 1;
      while (/\s/.test(raw[k] ?? '')) k += 1;
      const keys = open[open.length - 1];
      if (raw[k] === ':' && keys) {
        // JSON escapes decide equality: "A" and "A" are the same key.
        const key = JSON.parse(`"${text}"`) as string;
        if (keys.has(key)) found.push([...path, key].filter(Boolean).join(' › '));
        keys.add(key);
        lastKey = key;
      }
      i = j + 1;
      continue;
    }
    if (c === '{') {
      open.push(new Set());
      path.push(lastKey);
    } else if (c === '[') {
      open.push(null);
      path.push('');
    } else if (c === '}' || c === ']') {
      open.pop();
      path.pop();
    }
    i += 1;
  }
  return found;
}

describe('a key appears once in each object of each language file and the ledger', () => {
  it('finds a repeated key (the reader works)', () => {
    expect(duplicateKeys('{"a": 1, "b": {"c": 1, "c": 2}, "a": 3}')).toEqual(['b › c', 'a']);
    expect(duplicateKeys('{"a": {"x": 1}, "b": {"x": 1}}'), 'the same key in two objects is fine').toEqual([]);
    expect(duplicateKeys('{"a": "a", "b": "a"}'), 'a value equal to a key is not a key').toEqual([]);
    expect(duplicateKeys('{"a": "say \\"b\\": ok", "b": 1}'), 'a quote inside a value does not end it').toEqual([]);
    expect(duplicateKeys('{"A": 1, "\\u0041": 2}')).toEqual(['A']);
    expect(duplicateKeys('{"list": [{"k": 1}, {"k": 2}]}'), 'objects in an array are separate').toEqual([]);
  });

  const files = readdirSync(DIR).filter((name) => name.endsWith('.json'));

  it('reads the seven languages and the ledger (a moved folder cannot make it pass by finding nothing)', () => {
    expect(files.sort()).toEqual(['ar.json', 'en.json', 'es.json', 'ledger.json', 'pt-BR.json', 'ru.json', 'zh-CN.json', 'zh-HK.json']);
  });

  it.each(files)('%s has no repeated key', (name) => {
    expect(duplicateKeys(readFileSync(DIR + name, 'utf8'))).toEqual([]);
  });
});
