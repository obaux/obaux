'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { placeAsksForPolicies, type DummyPolicy } from '@pam/config/dummy-policies';
import { asksForSavedTrips, isSavedPlace } from './savedTrips';
import { useSession } from './useSession';

/**
 * A member's own signatures on programs' policies (D-270).
 *
 * **Example data only, for now**, like the program side (`usePolicies`,
 * D-261): nothing stores a signature anywhere but this browser tab. The
 * drawn signature is kept so the next policy is one tap — and kept in
 * *session* storage, not local, because Pam is often used on a phone that
 * is shared or borrowed, and a signature is not something to leave behind
 * on one. The real version keeps it with the account (before-launch list).
 *
 * Signed is per program and per policy: two programs can use a policy with
 * the same name, and signing one is not signing the other.
 */
const KEY = 'pam.mySignatures';
const EVENT = 'pam:mySignatures';

/** One signed policy: when, and the signature it was signed with. */
interface Signed {
  readonly at: string;
  readonly image: string | null;
}

interface Kept {
  /**
   * `${placeId}:${policyId}` → when, and with what. Each policy keeps the
   * picture it was signed with, so drawing a new signature later does not
   * change what an earlier policy shows (D-271).
   */
  readonly signed: Readonly<Record<string, Signed | string>>;
  /** The drawn signature, as a PNG data URL. */
  readonly signature: string | null;
}

const EMPTY: Kept = { signed: {}, signature: null };

function read(): Kept {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<Kept>) };
  } catch {
    // Storage off: nothing signed yet.
  }
  return EMPTY;
}

function write(kept: Kept): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(kept));
  } catch {
    // Not persisting is survivable in a demo.
  }
  window.dispatchEvent(new Event(EVENT));
}

export interface PolicyProgress {
  readonly total: number;
  readonly signed: number;
}

/** A stored entry; the first version kept only the time, as a string. */
function entry(value: Signed | string | undefined): Signed | null {
  if (!value) return null;
  return typeof value === 'string' ? { at: value, image: null } : value;
}

/*
 * A member's real signatures (D-485, migration 20261010145337): on a policy a
 * program keeps in the database (its id is a uuid) a signature is a row only the
 * member reads, and the saved picture is theirs, kept with the account. The
 * example policies keep to the tab, below, as before. Signing here is optimistic:
 * it shows at once and is written; if the database refuses, it is taken back.
 */
interface RealSigned {
  readonly at: string;
  readonly image: string | null;
}
const rs: { userId: string | null; signed: Readonly<Record<string, RealSigned>>; saved: string | null } = {
  userId: null,
  signed: {},
  saved: null,
};
let rsView = { ...rs };
const rsListeners = new Set<() => void>();
const rsPublish = () => {
  rsView = { ...rs };
  rsListeners.forEach((listener) => listener());
};
const rsSubscribe = (listener: () => void) => {
  rsListeners.add(listener);
  return () => {
    rsListeners.delete(listener);
  };
};

async function rsLoad(userId: string): Promise<void> {
  rs.userId = userId;
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    const [signed, saved] = await Promise.all([
      supabase.from('policy_signatures').select('policy_id, signed_at, image'),
      supabase.from('member_signatures').select('image').maybeSingle(),
    ]);
    if (signed.error) throw signed.error;
    rs.signed = Object.fromEntries(
      ((signed.data ?? []) as { policy_id: string; signed_at: string; image: string }[]).map((row) => [
        row.policy_id,
        { at: row.signed_at, image: row.image },
      ]),
    );
    rs.saved = (saved.data as { image: string } | null)?.image ?? null;
  } catch {
    // Nothing signed that we can see; the screens ask for signatures again, which is safe.
  }
  rsPublish();
}

async function rsSign(policyId: string, image: string | null): Promise<void> {
  const before = rs.signed[policyId];
  rs.signed = { ...rs.signed, [policyId]: { at: new Date().toISOString(), image: image ?? rs.saved } };
  if (image) rs.saved = image;
  rsPublish();
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('sign_policy', { p_policy_id: policyId, ...(image ? { p_image: image } : {}) });
    if (error) throw error;
  } catch {
    // Not recorded: take it back rather than show a signature that is not there.
    const next = { ...rs.signed };
    if (before) next[policyId] = before;
    else delete next[policyId];
    rs.signed = next;
    rsPublish();
  }
}

async function rsForget(): Promise<void> {
  rs.saved = null;
  rsPublish();
  try {
    const { createClient } = await import('./supabase');
    await createClient().rpc('forget_my_signature');
  } catch {
    // The saved picture stays on the account; harmless.
  }
}

export function useMySignatures(): {
  readonly signature: string | null;
  readonly signedAt: (placeId: string, policyId: string) => string | null;
  /** The signature a policy was signed with. */
  readonly signedWith: (placeId: string, policyId: string) => string | null;
  readonly progress: (placeId: string, policies: readonly DummyPolicy[]) => PolicyProgress;
  readonly sign: (placeId: string, policyId: string, signature?: string) => void;
  /** Takes a signature off one policy, to sign it again (D-271). */
  readonly unsign: (placeId: string, policyId: string) => void;
  readonly forgetSignature: () => void;
} {
  const [kept, setKept] = useState<Kept>(EMPTY);
  const { state: session } = useSession();
  const userId = asksForSavedTrips(session);
  const realNow = useSyncExternalStore(
    rsSubscribe,
    () => rsView,
    () => rsView,
  );
  useEffect(() => {
    if (userId !== null && rs.userId !== userId) void rsLoad(userId);
  }, [userId]);

  useEffect(() => {
    const sync = () => setKept(read());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const signedAt = useCallback(
    (placeId: string, policyId: string) =>
      isSavedPlace(policyId)
        ? (realNow.signed[policyId]?.at ?? null)
        : (entry(kept.signed[`${placeId}:${policyId}`])?.at ?? null),
    [kept, realNow],
  );

  const signedWith = useCallback(
    (placeId: string, policyId: string) => {
      if (isSavedPlace(policyId)) {
        const found = realNow.signed[policyId];
        return found ? (found.image ?? realNow.saved) : null;
      }
      const found = entry(kept.signed[`${placeId}:${policyId}`]);
      return found ? (found.image ?? kept.signature) : null;
    },
    [kept, realNow],
  );

  const progress = useCallback(
    (placeId: string, policies: readonly DummyPolicy[]): PolicyProgress => {
      // A real place asks for what its program put in the database; the caller passed those.
      if (isSavedPlace(placeId)) {
        return { total: policies.length, signed: policies.filter((p) => realNow.signed[p.id]).length };
      }
      if (!placeAsksForPolicies(placeId)) return { total: 0, signed: 0 };
      return {
        total: policies.length,
        signed: policies.filter((p) => kept.signed[`${placeId}:${p.id}`]).length,
      };
    },
    [kept, realNow],
  );

  const sign = useCallback((placeId: string, policyId: string, signature?: string) => {
    if (isSavedPlace(policyId)) {
      void rsSign(policyId, signature ?? null);
      return;
    }
    const now = read();
    const image = signature ?? now.signature;
    write({
      signature: image,
      signed: { ...now.signed, [`${placeId}:${policyId}`]: { at: new Date().toISOString(), image } },
    });
  }, []);

  const unsign = useCallback((placeId: string, policyId: string) => {
    if (isSavedPlace(policyId)) {
      // A record is not taken back: the screen draws a new signature, and signing again replaces this one.
      const next = { ...rs.signed };
      delete next[policyId];
      rs.signed = next;
      rsPublish();
      return;
    }
    const now = read();
    const signed = { ...now.signed };
    delete signed[`${placeId}:${policyId}`];
    write({ ...now, signed });
  }, []);

  const forgetSignature = useCallback(() => {
    write({ ...read(), signature: null });
    void rsForget();
  }, []);

  return { signature: userId !== null && realNow.userId === userId ? realNow.saved : kept.signature, signedAt, signedWith, progress, sign, unsign, forgetSignature };
}
