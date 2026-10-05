'use client';

import { useCallback, useEffect, useState } from 'react';
import { placeAsksForPolicies, type DummyPolicy } from '@pam/config/dummy-policies';

/**
 * A member's own signatures on programs' policies (D-270).
 *
 * **Example data only, for now**, like the program side (`usePolicies`,
 * D-261): nothing stores a signature anywhere but this browser tab. The
 * drawn signature is kept so the next policy is one tap — and kept in
 * *session* storage, not local, because PAM is often used on a phone that
 * is shared or borrowed, and a signature is not something to leave behind
 * on one. The real version keeps it with the account (before-launch list).
 *
 * Signed is per program and per policy: two programs can use a policy with
 * the same name, and signing one is not signing the other.
 */
const KEY = 'pam.mySignatures';
const EVENT = 'pam:mySignatures';

interface Kept {
  /** `${placeId}:${policyId}` → when it was signed. */
  readonly signed: Readonly<Record<string, string>>;
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

export function useMySignatures(): {
  readonly signature: string | null;
  readonly signedAt: (placeId: string, policyId: string) => string | null;
  readonly progress: (placeId: string, policies: readonly DummyPolicy[]) => PolicyProgress;
  readonly sign: (placeId: string, policyId: string, signature?: string) => void;
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
    (placeId: string, policyId: string) => kept.signed[`${placeId}:${policyId}`] ?? null,
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
    write({
      signature: signature ?? now.signature,
      signed: { ...now.signed, [`${placeId}:${policyId}`]: new Date().toISOString() },
    });
  }, []);

  const forgetSignature = useCallback(() => {
    write({ ...read(), signature: null });
  }, []);

  return { signature: kept.signature, signedAt, progress, sign, forgetSignature };
}
