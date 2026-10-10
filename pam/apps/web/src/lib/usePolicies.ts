'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { DUMMY_POLICIES, type DummyPolicy } from '@pam/config/dummy-policies';
import {
  POLICY_COLUMNS,
  checkPolicyFiles,
  contentTypeOf,
  policiesFromRows,
  safeFileName,
  titleFromFileName,
  type PolicyRow,
  type ProgramPolicy,
  type SignerRow,
} from './programPolicies';
import { useOwnProgram } from './useOwnProgram';
import { useSession } from './useSession';

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

/*
 * A real program's policies (D-261, migration 20261010144052): a program lead
 * with a program on file reads and writes them in the database, on any phone.
 * Everyone else — a demo account, a story, a member — still sees the example
 * set above, as before. One store for the page, read once per program and again
 * after a change.
 */
const NONE: readonly ProgramPolicy[] = [];
let real: Readonly<Record<string, readonly ProgramPolicy[]>> = {};
const asked = new Set<string>();
const listeners = new Set<() => void>();

function publish(next: Readonly<Record<string, readonly ProgramPolicy[]>>): void {
  real = next;
  listeners.forEach((listener) => listener());
}

async function loadPolicies(programId: string): Promise<void> {
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    const { data, error } = await supabase
      .from('program_policies')
      .select(POLICY_COLUMNS)
      .eq('service_id', programId)
      .is('archived_at', null);
    if (error) throw error;
    // Who signed each (the program's own lead only): a first name and a date. Without it, nobody has.
    const signers = await supabase.rpc('program_policy_signers', { p_service_id: programId });
    publish({
      ...real,
      [programId]: policiesFromRows((data ?? []) as PolicyRow[], signers.error ? [] : ((signers.data ?? []) as SignerRow[])),
    });
  } catch {
    // Show none rather than a wrong list.
    if (!(programId in real)) publish({ ...real, [programId]: NONE });
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** What adding a policy came to: it worked, a file was wrong (before anything was sent), or it could not be saved. */
export type AddPolicyResult = 'ok' | 'too_many' | 'too_big' | 'bad_type' | 'failed';

/** Put the files in the program's folder of the private bucket, then make the policy from them. */
async function savePolicy(programId: string, files: readonly File[], replaces: string | null): Promise<AddPolicyResult> {
  const problem = checkPolicyFiles(files);
  if (problem !== 'none') return problem;
  if (files.length === 0) return 'ok';
  const uploaded: string[] = [];
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    const bucket = supabase.storage.from('policies');
    const sent: { path: string; name: string; content_type: string; size_bytes: number }[] = [];
    for (const file of files) {
      const type = contentTypeOf(file);
      const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf';
      const path = `${programId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await bucket.upload(path, file, { contentType: type, upsert: false });
      if (error) throw error;
      uploaded.push(path);
      sent.push({ path, name: safeFileName(file.name), content_type: type, size_bytes: file.size });
    }
    const { error } = await supabase.rpc('add_policy', {
      p_service_id: programId,
      p_title: titleFromFileName(files[0]!.name),
      p_files: sent,
      ...(replaces ? { p_replaces: replaces } : {}),
    });
    if (error) throw error;
    await loadPolicies(programId);
    return 'ok';
  } catch {
    // Files that never made it into a policy are taken back (the database allows this).
    try {
      const { createClient } = await import('./supabase');
      if (uploaded.length > 0) await createClient().storage.from('policies').remove(uploaded);
    } catch {
      // Left behind, still private and still the program's.
    }
    return 'failed';
  }
}

export function usePolicies(): {
  readonly policies: readonly DummyPolicy[];
  /** Resolves with how it went; a real program's can fail where the example set cannot. */
  readonly add: (files: readonly File[]) => Promise<AddPolicyResult>;
  /** Resolves false when a real program's policy could not be taken off. */
  readonly remove: (ids: readonly string[]) => Promise<boolean>;
  /** A new version of a real policy (the old one is archived and kept). */
  readonly replace: (id: string, files: readonly File[]) => Promise<AddPolicyResult>;
  /** The database is still being asked: screens hold their "none yet" back. */
  readonly isLoading: boolean;
  /** The real program these belong to; null for the example set. */
  readonly programId: string | null;
} {
  const { state: session } = useSession();
  const own = useOwnProgram(session);
  const programId = own.status === 'ready' ? own.program.id : null;
  const realNow = useSyncExternalStore(
    subscribe,
    () => real,
    () => real,
  );
  const [policies, setPolicies] = useState<readonly DummyPolicy[]>(DUMMY_POLICIES);

  useEffect(() => {
    const sync = () => setPolicies(current(read()));
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  useEffect(() => {
    if (programId !== null && !asked.has(programId)) {
      asked.add(programId);
      void loadPolicies(programId);
    }
  }, [programId]);

  const add = useCallback(
    async (files: readonly File[]): Promise<AddPolicyResult> => {
      if (programId !== null) return savePolicy(programId, files, null);
      const kept = read();
      const now = new Date().toISOString();
      const added = files.map((file, i) => ({
        id: `policy-added-${Date.now()}-${i}`,
        title: titleFromFileName(file.name),
        fileName: file.name,
        uploadedAt: now,
        body: [],
        signedBy: [],
      }));
      write({ ...kept, added: [...kept.added, ...added] });
      return 'ok';
    },
    [programId],
  );

  const remove = useCallback(
    async (ids: readonly string[]): Promise<boolean> => {
      if (programId !== null) {
        try {
          const { createClient } = await import('./supabase');
          const supabase = createClient();
          for (const id of ids) {
            const { error } = await supabase.rpc('archive_policy', { p_id: id });
            if (error) throw error;
          }
          await loadPolicies(programId);
          return true;
        } catch {
          await loadPolicies(programId);
          return false;
        }
      }
      const kept = read();
      write({ added: kept.added.filter((p) => !ids.includes(p.id)), removed: [...kept.removed, ...ids] });
      return true;
    },
    [programId],
  );

  const replace = useCallback(
    async (id: string, files: readonly File[]): Promise<AddPolicyResult> => {
      if (programId !== null) return savePolicy(programId, files, id);
      const result = await add(files);
      if (result === 'ok') await remove([id]);
      return result;
    },
    [programId, add, remove],
  );

  if (programId !== null) {
    const mine = realNow[programId];
    return { policies: mine ?? NONE, add, remove, replace, isLoading: mine === undefined, programId };
  }
  return { policies, add, remove, replace, isLoading: false, programId: null };
}

/** Open one page of a real policy: a short-lived link, made with the person's sign-in. */
export async function openPolicyFile(path: string): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().storage.from('policies').createSignedUrl(path, 300);
    if (error || !data?.signedUrl) return false;
    const link = document.createElement('a');
    link.href = data.signedUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.click();
    return true;
  } catch {
    return false;
  }
}

/** The policies this person has signed, of the ones the program has now. */
export function signedBy(personId: string, policies: readonly DummyPolicy[]): readonly DummyPolicy[] {
  return policies.filter((p) => p.signedBy.some((s) => s.personId === personId));
}

/** Verified: the program has policies, and this person has signed every one. */
export function isVerified(personId: string, policies: readonly DummyPolicy[]): boolean {
  return policies.length > 0 && signedBy(personId, policies).length === policies.length;
}
