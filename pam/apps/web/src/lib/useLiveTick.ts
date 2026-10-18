'use client';

import { useEffect, useState } from 'react';

/**
 * A number that goes up when something on screen should look again (Iris S1, Will: messaging "works better than any other part of
 * the app"): every `everyMs` while the app is in front of the person, once at once when it comes back (the tab or the window
 * gets focus), and once when the phone is back on the network. In the background nothing runs, so it costs nothing there.
 *
 * A reader of a conversation or a list puts the number among the things its load depends on and loads again quietly when it
 * changes. There is no server push: the app asks, so it is the same on every phone and nothing can fail silently (a lost
 * connection is only a missed ask, and the next one catches up).
 */
export function useLiveTick(enabled: boolean, everyMs: number): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;
    const bump = () => setTick((n) => n + 1);
    const visible = () => document.visibilityState === 'visible';
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer === null) timer = setInterval(() => visible() && bump(), everyMs);
    };
    const stop = () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (visible()) {
        bump();
        start();
      } else {
        stop();
      }
    };
    const onBack = () => visible() && bump();
    if (visible()) start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onBack);
    window.addEventListener('online', onBack);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onBack);
      window.removeEventListener('online', onBack);
    };
  }, [enabled, everyMs]);
  return tick;
}
