import type { Viewport } from 'next';
import { RootShell } from '../../../components/RootShell';
import { ABOUT, builtLangs, type AboutLang } from '../../../content/about';

// A second root layout, for pages that are in one language: `<html lang dir>` comes
// from the address. `dynamicParams = false` makes any other address a 404, and the
// list is only the languages Will has signed (`content/about.ts`).
export function generateStaticParams() {
  return builtLangs().map((lang) => ({ lang }));
}

export const dynamicParams = false;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#101012' },
  ],
};

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const lang = (await params).lang as AboutLang;
  return (
    <RootShell lang={lang} dir={ABOUT[lang]?.dir ?? 'ltr'}>
      {children}
    </RootShell>
  );
}
