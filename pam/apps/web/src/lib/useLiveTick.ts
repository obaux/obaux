'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A number that goes up when something on screen should look again (Iris S1, D-613; Will: messaging "works better than any other
 * part of the app"). One shared ticker for every reader of messaging (a thread, the list, the bell, the team's inbox):
 *
 *   - It runs only while the app is in front of the person AND on the network: nothing runs in the background or offline, so a
 *     hidden tab makes no requests.
 *   - It asks again at once when the app comes back (the tab becomes visible, the window gets focus) and when the network does.
 *   - Every ask ends with `settle(true)` (it worked) or `settle(false)` (it did not). After a failure the wait doubles
 *     (8 s, 16 s, 32 s, up to 60 s); after a success it is back to `everyMs`. So a bad connection is never a tight loop, and
 *     the next ask is the catch-up for everything the last one missed.
 *   - A reader that never settles (its ask hung) is treated as a failure after 20 s, so the ticker cannot stall.
 *
 * The reader puts `tick` among the things its load depends on and loads again quietly when it changes. A failed ask says
 * nothing on screen: only what the person did themselves shows an error.
 */
export function useLiveTick(enabled: boolean, everyMs: number): { readonly tick: number; readonly settle: (ok: boolean) => void } {
  const [tick, setTick] = useState(0);
  const settleRef = useRef<(ok: boolean) => void>(() => {});
  const settle = useCallback((ok: boolean) => settleRef.current(ok), []);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;
    const MAX = 60_000;
    let delay = everyMs;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let watchdog: ReturnType<typeof setTimeout> | null = null;
    let asking = false;
    let gone = false;

    const present = () => document.visibilityState === 'visible' && navigator.onLine !== false;
    const clear = () => {
      if (timer !== null) clearTimeout(timer);
      if (watchdog !== null) clearTimeout(watchdog);
      timer = null;
      watchdog = null;
    };
    const schedule = () => {
      if (gone) return;
      if (timer !== null) clearTimeout(timer);
      timer = present() ? setTimeout(fire, delay) : null;
    };
    const fire = () => {
      timer = null;
      if (gone || !present() || asking) return;
      asking = true;
      setTick((n) => n + 1);
      watchdog = setTimeout(() => settleRef.current(false), 20_000);
    };
    settleRef.current = (ok: boolean) => {
      if (gone) return;
      if (watchdog !== null) clearTimeout(watchdog);
      watchdog = null;
      asking = false;
      delay = ok ? everyMs : Math.min(delay * 2, MAX);
      schedule();
    };
    // Back in front, or back on the network: ask at once, and start the waits again from the short one.
    const back = () => {
      if (!present()) return;
      delay = everyMs;
      if (asking) return;
      clear();
      fire();
    };
    const away = () => {
      if (!present()) clear();
    };
    schedule();
    document.addEventListener('visibilitychange', back);
    document.addEventListener('visibilitychange', away);
    window.addEventListener('focus', back);
    window.addEventListener('online', back);
    window.addEventListener('offline', away);
    return () => {
      gone = true;
      clear();
      document.removeEventListener('visibilitychange', back);
      document.removeEventListener('visibilitychange', away);
      window.removeEventListener('focus', back);
      window.removeEventListener('online', back);
      window.removeEventListener('offline', away);
    };
  }, [enabled, everyMs]);

  return { tick, settle };
}
