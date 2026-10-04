'use client';

import { useCallback, useEffect, useState } from 'react';
import { DUMMY_POLICIES, type DummyPolicy } from '@pam/config/dummy-policies';

/**
 * A program's policies for participants (D-261), and who has signed them.
 *
 * **Example data only, for now**, like starred people (D-218): there is no
 * table for policies or signatures yet. Adding and removing is kept for the
 * browser session over the example set, so the screens can be tried end to
 * end; uploaded files are not stored anywhere — only their names are shown.
 */
const KEY = 'pam.policies';
const EVENT = 'pam:policies';

interface Kept {
  readonly added: readonly DummyPolicy[];
  readonly removed: readonly string[];
}

function read(): Kept {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Kept;
  } catch {
    // Storage off: the example set as it is.
  }
  return { added: [], removed: [] };
}

function write(kept: Kept): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(kept));
  } catch {
    // Not persisting is survivable in a demo.
  }
  window.dispatchEvent(new Event(EVENT));
}

function current(kept: Kept): readonly DummyPolicy[] {
  return [...DUMMY_POLICIES, ...kept.added].filter((p) => !kept.removed.includes(p.id));
}

/** A title from a file name: "code-of-conduct.pdf" → "Code of conduct". */
function titleFrom(fileName: string): string {
  const base = fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : fileName;
}

export function usePolicies(): {
  readonly policies: readonly DummyPolicy[];
  readonly add: (files: readonly File[]) => void;
  readonly remove: (ids: readonly string[]) => void;
} {
  const [policies, setPolicies] = useState<readonly DummyPolicy[]>(DUMMY_POLICIES);

  useEffect(() => {
    const sync = () => setPolicies(current(read()));
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const add = useCallback((files: readonly File[]) => {
    const kept = read();
    const now = new Date().toISOString();
    const added = files.map((file, i) => ({
      id: `policy-added-${Date.now()}-${i}`,
      title: titleFrom(file.name),
      fileName: file.name,
      uploadedAt: now,
      body: [],
      signedBy: [],
    }));
    write({ ...kept, added: [...kept.added, ...added] });
  }, []);

  const remove = useCallback((ids: readonly string[]) => {
    const kept = read();
    write({ added: kept.added.filter((p) => !ids.includes(p.id)), removed: [...kept.removed, ...ids] });
  }, []);

  return { policies, add, remove };
}

/** The policies this person has signed, of the ones the program has now. */
export function signedBy(personId: string, policies: readonly DummyPolicy[]): readonly DummyPolicy[] {
  return policies.filter((p) => p.signedBy.some((s) => s.personId === personId));
}

/** Verified: the program has policies, and this person has signed every one. */
export function isVerified(personId: string, policies: readonly DummyPolicy[]): boolean {
  return policies.length > 0 && signedBy(personId, policies).length === policies.length;
}
