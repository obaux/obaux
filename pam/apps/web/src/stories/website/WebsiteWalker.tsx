'use client';

import { useEffect, useState } from 'react';
import { SiteShell } from '../../../../site/src/components/SiteShell';
import { anyPostBySlug } from '../../../../site/src/content/posts';
import { ABOUT, ABOUT_LANGS, type AboutLang } from '../../../../site/src/content/about';
import { RulesScreen } from '../../../../site/src/screens/RulesScreen';
import { AboutScreen } from '../../../../site/src/screens/AboutScreen';
import { HomeScreen } from '../../../../site/src/screens/HomeScreen';
import { PostScreen } from '../../../../site/src/screens/PostScreen';
import { SupportScreen } from '../../../../site/src/screens/SupportScreen';

/**
 * The public website (apps/site, D-437) walked inside Storybook: the real
 * header, pages and footer, with the site's own links followed here instead of
 * by the browser. A story is one page of Storybook, not the site, so a link must
 * never navigate the frame (D-212); this is the website's version of the app's
 * clickable prototype.
 *
 * Links are caught in the capture phase, before the preview's own handler, and
 * routed by address. A link out of the site (Sign in, Privacy, Terms go to the
 * app) is named in the console and goes nowhere: the app is a different product
 * with its own journeys.
 */
function resolve(path: string): { readonly nav: string; readonly page: 'home' | 'support' | 'post' | 'about' | 'rules'; readonly slug?: string } {
  const clean = path.replace(/[?#].*$/, '');
  if (clean === '/' || clean === '') return { nav: '/', page: 'home' };
  const about = /^\/([A-Za-z-]+)\/about-pam\/?$/.exec(clean);
  if (about?.[1] && about[1] in ABOUT) return { nav: clean, page: 'about', slug: about[1] };
  const rules = /^\/([A-Za-z-]+)\/program-rules\/?$/.exec(clean);
  if (rules?.[1] && rules[1] in ABOUT) return { nav: clean, page: 'rules', slug: rules[1] };
  const post = /^\/support\/([^/]+)\/?$/.exec(clean);
  if (post?.[1] && anyPostBySlug(post[1])) return { nav: clean, page: 'post', slug: post[1] };
  return { nav: '/support/', page: 'support' };
}

export function WebsiteWalker({ start = '/', showAbout = false }: { readonly start?: string; readonly showAbout?: boolean }) {
  const [path, setPath] = useState(start);
  // A control changed, or a story was picked: begin again from there.
  useEffect(() => setPath(start), [start]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      if (href.startsWith('#')) return;
      event.preventDefault();
      event.stopPropagation();
      if (href.startsWith('/')) {
        setPath(href);
        window.scrollTo({ top: 0 });
      } else {
        // eslint-disable-next-line no-console
        console.info('[website journey] leaves the site for the app — not followed:', href);
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  const here = resolve(path);
  return (
    <SiteShell path={here.nav}>
      {here.page === 'home' ? <HomeScreen showAbout={showAbout} /> : null}
      {here.page === 'support' ? <SupportScreen key={path} /> : null}
      {here.page === 'post' && here.slug ? <PostScreen slug={here.slug} allowDraft /> : null}
      {here.page === 'about' && here.slug ? (
        <AboutScreen key={path} lang={here.slug as AboutLang} languages={ABOUT_LANGS} draft />
      ) : null}
      {here.page === 'rules' && here.slug ? (
        <RulesScreen key={path} lang={here.slug as AboutLang} languages={ABOUT_LANGS} draft />
      ) : null}
    </SiteShell>
  );
}
