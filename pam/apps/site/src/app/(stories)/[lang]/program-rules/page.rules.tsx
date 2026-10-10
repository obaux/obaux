import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ABOUT, ABOUT_LANGS, type AboutLang } from '../../../../content/about';
import { RULES, rulesBuiltLangs, rulesPath } from '../../../../content/rules';
import { SITE_URL } from '../../../../lib/links';
import { SHARE_IMAGE } from '../../../../lib/share';
import { RulesScreen } from '../../../../screens/RulesScreen';

export function generateStaticParams() {
  return rulesBuiltLangs().map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = (await params).lang as AboutLang;
  const t = RULES[lang];
  if (!t) return {};
  const built = [...rulesBuiltLangs(), 'en' as AboutLang];
  const languages = Object.fromEntries(built.map((l) => [l, new URL(rulesPath(l), SITE_URL).href]));
  const image = { ...SHARE_IMAGE };
  return {
    title: `${t.title} — Pam`,
    description: t.summary,
    alternates: { canonical: new URL(rulesPath(lang), SITE_URL).href, languages: { ...languages, 'x-default': languages.en } },
    openGraph: { type: 'article', siteName: 'Pam', locale: lang.replace('-', '_'), title: t.title, description: t.summary, images: [image] },
    twitter: { card: 'summary_large_image', title: t.title, description: t.summary, images: [image] },
  };
}

export default async function RulesPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as AboutLang;
  if (!ABOUT[lang] || !ABOUT_LANGS.includes(lang) || !rulesBuiltLangs().includes(lang)) notFound();
  return <RulesScreen lang={lang} languages={['en', ...rulesBuiltLangs()]} />;
}
