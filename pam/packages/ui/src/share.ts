import { stripIsolates } from '@pam/config';

/**
 * The phone's own share sheet, wherever Pam runs (D-350).
 *
 * - **In the app** (Capacitor), `@capacitor/share`: the native sheet on iOS
 *   and on Android. Android's WebView has no `navigator.share`, so without
 *   the plugin the Android app could only copy. The plugin is reached at
 *   runtime through `window.Capacitor.Plugins` — the native shell installs
 *   it (`apps/native`), and the web build never imports Capacitor.
 * - **In a phone's browser**, `navigator.share`.
 * - **Neither** (a desktop browser): there is no sheet; callers copy instead.
 *
 * `shareText` resolves true when a sheet opened (even if the person then
 * closed it — that is a choice, not an error), false when there is none.
 */
interface CapacitorShare {
  share(options: { text?: string; title?: string; dialogTitle?: string }): Promise<unknown>;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  Plugins?: { Share?: CapacitorShare };
}

function nativeShare(): CapacitorShare | null {
  const cap = (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  return cap.Plugins?.Share ?? null;
}

/** Whether this device has a share sheet Pam can open. Ask after mount. */
export function canShareSheet(): boolean {
  if (nativeShare()) return true;
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Opens the share sheet with `text`; false when there is no sheet.
 *
 * What is shared goes to somebody else's phone, which draws it its own way and
 * turns a link in it into a link: the invisible isolates `t` puts round a value
 * in Arabic (D-435) have no business there, whoever built the string.
 */
export async function shareText(rawText: string, title?: string): Promise<boolean> {
  const text = stripIsolates(rawText);
  const native = nativeShare();
  try {
    if (native) {
      await native.share({ text, ...(title ? { title, dialogTitle: title } : {}) });
      return true;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ text, ...(title ? { title } : {}) });
      return true;
    }
  } catch {
    // Closed the sheet: still a sheet that opened.
    return true;
  }
  return false;
}
