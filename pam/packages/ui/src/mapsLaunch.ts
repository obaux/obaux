/**
 * Sending an address to a maps app, and to the store when the app is not there
 * (Will, 10 October 2026: "if no app installed, redirect to app store, based on
 * their device, android vs ios", D-435).
 *
 * A web page cannot ask a phone "is Google Maps installed?" — only try, and see.
 * So each phone gets the way that is reliable for it:
 *
 *  - **Android, Google Maps:** an `intent://` link. Chrome and the other Android
 *    browsers open the app if it is there and go to its Play Store page if it is
 *    not, without any script.
 *  - **iPhone and iPad, Google Maps:** Google's own address scheme is tried; if
 *    the page is still in front a moment later nothing took it, and the App
 *    Store page opens instead (`openAppOrStore`).
 *  - **iPhone and iPad, Apple Maps:** Apple's link. Maps comes with the phone,
 *    and the link opens it; there is nothing to fall back to.
 *  - **Android, Apple Maps:** there is no such app, so no row (`null`).
 *  - **A computer:** the maps' own web pages, in a new tab.
 */
export type DevicePlatform = 'ios' | 'android' | 'other';
export type MapsApp = 'google' | 'apple';

export const GOOGLE_MAPS_PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.maps';
export const GOOGLE_MAPS_APP_STORE = 'https://apps.apple.com/app/google-maps/id585027354';

const GOOGLE_MAPS_ANDROID_PACKAGE = 'com.google.android.apps.maps';

/** Which kind of phone this is, from what the browser says about itself. */
export function devicePlatform(userAgent: string, maxTouchPoints = 0): DevicePlatform {
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  // An iPad asks for the desktop site by default and calls itself a Mac. A Mac
  // has no touch screen, so touch is what tells them apart.
  if (/macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'ios';
  return 'other';
}

export interface MapsLaunch {
  /** Where the row goes: a web page, or on Android an intent that falls back to the Play Store. */
  readonly href: string;
  /** A web page opens in a new tab; leaving for an app does not need one. */
  readonly isExternal: boolean;
  /**
   * iPhone and iPad only: the app's own address to try, and the App Store page
   * to go to when nothing answered it. The row's click does this instead of
   * following `href`.
   */
  readonly tryApp?: { readonly appUrl: string; readonly storeUrl: string };
}

/** The destination in a Google Maps directions link, or null when it has none. */
function googleDestination(webHref: string): string | null {
  try {
    return new URL(webHref).searchParams.get('destination');
  } catch {
    return null;
  }
}

/**
 * How `app` is opened on this kind of device, given its web link. Null when the
 * app does not exist there (Apple Maps on Android).
 */
export function mapsLaunchFor(
  app: MapsApp,
  webHref: string,
  platform: DevicePlatform,
): MapsLaunch | null {
  if (app === 'apple') {
    if (platform === 'android') return null;
    return { href: webHref, isExternal: platform === 'other' };
  }

  if (platform === 'android') {
    try {
      const url = new URL(webHref);
      const fallback = encodeURIComponent(GOOGLE_MAPS_PLAY_STORE);
      return {
        href:
          `intent://${url.host}${url.pathname}${url.search}` +
          `#Intent;scheme=https;package=${GOOGLE_MAPS_ANDROID_PACKAGE};` +
          `S.browser_fallback_url=${fallback};end`,
        isExternal: false,
      };
    } catch {
      return { href: webHref, isExternal: true };
    }
  }

  if (platform === 'ios') {
    const destination = googleDestination(webHref);
    return {
      href: webHref,
      isExternal: false,
      ...(destination
        ? {
            tryApp: {
              appUrl: `comgooglemaps://?daddr=${encodeURIComponent(destination)}`,
              storeUrl: GOOGLE_MAPS_APP_STORE,
            },
          }
        : {}),
    };
  }

  return { href: webHref, isExternal: true };
}

/** How long to wait for an app to take over before deciding it is not there. */
export const APP_WAIT_MS = 2000;

/**
 * Tries an app's own address; if the page is still in front after a moment,
 * nothing answered, so it opens the store page instead.
 *
 * Anything that says the page was left (hidden, blurred, put away) means the
 * app did open — or the person is answering a "Open in…?" prompt — and the
 * store is not opened over them.
 */
export function openAppOrStore(
  appUrl: string,
  storeUrl: string,
  win: Window = window,
  waitMs: number = APP_WAIT_MS,
): void {
  const doc = win.document;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const stop = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    doc.removeEventListener('visibilitychange', onVisibility);
    win.removeEventListener('pagehide', stop);
    win.removeEventListener('blur', stop);
  };
  const onVisibility = () => {
    if (doc.hidden) stop();
  };

  doc.addEventListener('visibilitychange', onVisibility);
  win.addEventListener('pagehide', stop);
  win.addEventListener('blur', stop);
  timer = setTimeout(() => {
    stop();
    win.location.href = storeUrl;
  }, waitMs);

  win.location.href = appUrl;
}
