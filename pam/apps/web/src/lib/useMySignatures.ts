'use client';

import { useCallback, useEffect, useState } from 'react';
import { placeAsksForPolicies, type DummyPolicy } from '@pam/config/dummy-policies';

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

  useEffect(() => {
    const sync = () => setKept(read());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const signedAt = useCallback(
    (placeId: string, policyId: string) => entry(kept.signed[`${placeId}:${policyId}`])?.at ?? null,
    [kept],
  );

  const signedWith = useCallback(
    (placeId: string, policyId: string) => {
      const found = entry(kept.signed[`${placeId}:${policyId}`]);
      return found ? (found.image ?? kept.signature) : null;
    },
    [kept],
  );

  const progress = useCallback(
    (placeId: string, policies: readonly DummyPolicy[]): PolicyProgress => {
      if (!placeAsksForPolicies(placeId)) return { total: 0, signed: 0 };
      return {
        total: policies.length,
        signed: policies.filter((p) => kept.signed[`${placeId}:${p.id}`]).length,
      };
    },
    [kept],
  );

  const sign = useCallback((placeId: string, policyId: string, signature?: string) => {
    const now = read();
    const image = signature ?? now.signature;
    write({
      signature: image,
      signed: { ...now.signed, [`${placeId}:${policyId}`]: { at: new Date().toISOString(), image } },
    });
  }, []);

  const unsign = useCallback((placeId: string, policyId: string) => {
    const now = read();
    const signed = { ...now.signed };
    delete signed[`${placeId}:${policyId}`];
    write({ ...now, signed });
  }, []);

  const forgetSignature = useCallback(() => {
    write({ ...read(), signature: null });
  }, []);

  return { signature: kept.signature, signedAt, signedWith, progress, sign, unsign, forgetSignature };
}
