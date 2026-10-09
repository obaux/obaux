import { useEffect } from 'react';
import type { Decorator, Preview } from '@storybook/nextjs';
import { Theme } from '@astryxdesign/core/theme';
import { MotionProvider } from '@pam/ui';
import { isSupportedLocale, type Locale, type TextBundle } from '@pam/config';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ptBR from '@pam/config/locales/pt-BR.json';
import zhCN from '@pam/config/locales/zh-CN.json';
import zhHK from '@pam/config/locales/zh-HK.json';
import ru from '@pam/config/locales/ru.json';
import ar from '@pam/config/locales/ar.json';
import { pseudoBundle } from '@pam/config/pseudo';
import { pamTheme } from '@pam/ui/theme';
import { I18nProvider, useI18n } from '../src/lib/i18n';
import { AlertBannerProvider } from '../src/lib/alertBanner';

// The same stylesheets, in the same order, as src/app/layout.tsx.
import '../src/app/layers.css';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@pam/ui/theme/pam.css';
import '@pam/ui/fonts.css';
import '../src/app/globals.css';

/**
 * Follows the toolbar's light/dark switch for the whole page. `<Theme mode>`
 * only re-themes its own subtree; the page behind a story — `<html>`, whose
 * `color-scheme: light dark` follows the computer's setting (globals.css) —
 * would stay light, and a light title on it vanishes. In the app the two
 * always agree, because both follow the phone.
 */
function SchemeBridge({ mode }: { readonly mode: 'light' | 'dark' }) {
  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
  }, [mode]);
  return null;
}

/**
 * Every language, already in hand: Storybook has no network to wait on and a
 * story must paint in its language the first time, not English and then
 * Spanish. (The app loads them on demand.)
 */
const BUNDLES: Record<Locale, TextBundle> = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar };

/**
 * The English stretched ~40% and wrapped in ⟦ ⟧ (D-424): a way to see whether a
 * screen holds longer words before any translation exists, and to find a string
 * that never went through `t()` (it stays unaccented). Storybook only.
 */
const BUNDLES_PSEUDO: Record<Locale, TextBundle> = { ...BUNDLES, en: pseudoBundle(en) };

/** Follows the toolbar's language switch. */
function LocaleBridge({ locale }: { readonly locale: Locale }) {
  const { setLocale } = useI18n();
  useEffect(() => setLocale(locale), [locale, setLocale]);
  return null;
}

/**
 * What `Providers` gives every route, minus `LocaleSync` (it reads the
 * signed-in account, and Storybook has none): the PAM theme, motion, i18n and
 * the alert banner.
 */
const withPam: Decorator = (Story, context) => {
  const mode = context.globals['theme'] === 'dark' ? 'dark' : 'light';
  const chosen = String(context.globals['locale'] ?? '');
  const pseudo = chosen === 'pseudo';
  const locale: Locale = isSupportedLocale(chosen) ? chosen : 'en';
  return (
    <Theme theme={pamTheme} mode={mode}>
      <MotionProvider>
        <I18nProvider key={pseudo ? 'pseudo' : 'real'} bundles={pseudo ? BUNDLES_PSEUDO : BUNDLES} initialLocale={locale}>
          <SchemeBridge mode={mode} />
          <LocaleBridge locale={locale} />
          <AlertBannerProvider>
            <Story />
          </AlertBannerProvider>
        </I18nProvider>
      </MotionProvider>
    </Theme>
  );
};

/**
 * No story ever navigates the iframe (D-212). A story is one page of
 * Storybook, not the app; following a link to `/places/` loads a page that
 * does not exist there, and Storybook shows a 404 in the frame. The clickable
 * prototype (`PrototypeApp`, D-211) routes the links it can draw, in the
 * capture phase; whatever is left by the time a same-site link click bubbles
 * up to the window is cancelled here, and named in the console instead.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    const anchor = (event.target as Element | null)?.closest?.('a[href]');
    if (!anchor || anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) return;
    const href = anchor.getAttribute('href') ?? '';
    if (href.startsWith('#') || /^(tel:|mailto:|sms:)/i.test(href)) return;
    if (new URL(href, window.location.href).origin !== window.location.origin) return;
    event.preventDefault();
    // eslint-disable-next-line no-console
    console.info('[storybook] link not followed — open the Prototype stories to click through:', href);
  });
}

const preview: Preview = {
  decorators: [withPam],
  globalTypes: {
    locale: {
      description: 'Language',
      toolbar: {
        title: 'Language',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'es', title: 'Español' },
          { value: 'pt-BR', title: 'Português (Brasil)' },
          { value: 'zh-CN', title: '简体中文（普通话）' },
          { value: 'zh-HK', title: '繁體中文（廣東話）' },
          { value: 'ru', title: 'Русский' },
          { value: 'ar', title: 'العربية' },
          { value: 'pseudo', title: 'Pseudo-language (English +40%)' },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: 'Light or dark',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    locale: 'en',
    theme: 'light',
    viewport: { value: 'iphoneSe', isRotated: false },
  },
  parameters: {
    layout: 'fullscreen',
    // PAM is phone-first; these are the two widths the Playwright suite proves.
    viewport: {
      options: {
        narrow320: { name: 'Narrow phone (320px)', styles: { width: '320px', height: '640px' }, type: 'mobile' },
        iphoneSe: { name: 'iPhone SE (375px)', styles: { width: '375px', height: '667px' }, type: 'mobile' },
        iphone15: { name: 'iPhone 15 (393px)', styles: { width: '393px', height: '852px' }, type: 'mobile' },
        desktop: { name: 'Desktop (1280px)', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
      },
    },
    nextjs: { appDirectory: true },
    a11y: { test: 'error' },
    controls: { expanded: true },
    // One folder per kind of account, each opening on its clickable
    // prototype (D-217); the components after them.
    options: {
      storySort: {
        // Member first (Will, 7 October): the stories are titled "Member/…",
        // so the old "Member app" never matched and Member fell to the end.
        order: [
          'Member',
          ['Prototype', 'Created', 'Invited by case manager', 'Invited by program'],
          'Case manager',
          ['Prototype', 'Screens', 'States'],
          'Program lead',
          ['Prototype', 'Screens', 'States'],
          'Super admin',
          ['Prototype', 'Screens', 'States'],
          'Components',
        ],
      },
    },
  },
};

export default preview;
