'use client';

import { useEffect, useState } from 'react';
import { SiteShell } from '../../../../site/src/components/SiteShell';
import { anyPostBySlug } from '../../../../site/src/content/posts';
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
function resolve(path: string): { readonly nav: string; readonly page: 'home' | 'support' | 'post'; readonly slug?: string } {
  const clean = path.replace(/[?#].*$/, '');
  if (clean === '/' || clean === '') return { nav: '/', page: 'home' };
  const post = /^\/support\/([^/]+)\/?$/.exec(clean);
  if (post?.[1] && anyPostBySlug(post[1])) return { nav: clean, page: 'post', slug: post[1] };
  return { nav: '/support/', page: 'support' };
}

export function WebsiteWalker({ start = '/' }: { readonly start?: string }) {
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
      {here.page === 'home' ? <HomeScreen /> : null}
      {here.page === 'support' ? <SupportScreen key={path} /> : null}
      {here.page === 'post' && here.slug ? <PostScreen slug={here.slug} allowDraft /> : null}
    </SiteShell>
  );
}
