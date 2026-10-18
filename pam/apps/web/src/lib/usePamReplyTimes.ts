'use client';

import { useEffect, useState } from 'react';
import { pamReplyTimes, type PamReplyTimes } from './pam';

/**
 * How long the Pam team usually takes to reply, over the last 30 days (card a100): the inbox's foot line. Null until
 * something has been answered, and on any failure: the line is a help, never a reason to show an error.
 */
export function usePamReplyTimes(enabled: boolean): PamReplyTimes | null {
  const [times, setTimes] = useState<PamReplyTimes | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void pamReplyTimes(30).then((result) => {
      if (!cancelled) setTimes(result.ok ? result.value : null);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return times;
}
