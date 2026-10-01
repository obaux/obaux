import { useEffect } from 'react';
import type { Decorator, Preview } from '@storybook/nextjs';
import { Theme } from '@astryxdesign/core/theme';
import { MotionProvider } from '@pam/ui';
import type { Locale } from '@pam/config';
import { pamTheme } from '../src/theme/pam.js';
import { I18nProvider, useI18n } from '../src/lib/i18n';
import { AlertBannerProvider } from '../src/lib/alertBanner';

// The same stylesheets, in the same order, as src/app/layout.tsx.
import '../src/app/layers.css';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '../src/theme/pam.css';
import '../src/app/globals.css';

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
  const locale = (context.globals['locale'] === 'es' ? 'es' : 'en') as Locale;
  return (
    <Theme theme={pamTheme} mode={mode}>
      <MotionProvider>
        <I18nProvider>
          <LocaleBridge locale={locale} />
          <AlertBannerProvider>
            <Story />
          </AlertBannerProvider>
        </I18nProvider>
      </MotionProvider>
    </Theme>
  );
};

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
  },
};

export default preview;
