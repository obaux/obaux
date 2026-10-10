import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ABOUT, ABOUT_ART, aboutPath, builtLangs, type AboutLang } from '../../../../content/about';
import { AboutScreen } from '../../../../screens/AboutScreen';
import { SITE_URL } from '../../../../lib/links';

export function generateStaticParams() {
  return builtLangs().map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = (await params).lang as AboutLang;
  const t = ABOUT[lang];
  if (!t) return {};
  const languages = Object.fromEntries(builtLangs().map((l) => [l, new URL(aboutPath(l), SITE_URL).href]));
  const image = { url: ABOUT_ART.share, width: 1200, height: 630, alt: t.artAlt };
  return {
    title: `${t.title} — Pam`,
    description: t.summary,
    alternates: {
      canonical: new URL(aboutPath(lang), SITE_URL).href,
      // `x-default` is the English page.
      languages: { ...languages, 'x-default': languages.en ?? new URL(aboutPath('en'), SITE_URL).href },
    },
    openGraph: { type: 'article', siteName: 'Pam', locale: lang.replace('-', '_'), title: t.title, description: t.summary, images: [image] },
    twitter: { card: 'summary_large_image', title: t.title, description: t.summary, images: [image] },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as AboutLang;
  if (!ABOUT[lang] || !builtLangs().includes(lang)) notFound();
  return <AboutScreen lang={lang} languages={builtLangs()} />;
}
