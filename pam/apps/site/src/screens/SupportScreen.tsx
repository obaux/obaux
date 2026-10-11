'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Divider } from '@astryxdesign/core/Divider';
import { Section } from '@astryxdesign/core/Section';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { SearchPill } from '@pam/ui/SearchPill';
import type { SearchSource } from '@astryxdesign/core/Typeahead';
import { tap } from '../lib/tap';
import { SecondaryButton } from '../components/SecondaryButton';
import { Link } from '@astryxdesign/core/Link';
import { POSTS, type SupportPost } from '../content/posts';
import { TOPICS } from '../content/topics';
import { Frame } from '../components/Frame';
import { StillStuck } from '../components/StillStuck';
import { SEARCH_PHRASES } from '../content/search-phrases';
import { MOST_ASKED } from '../content/most-asked';
import { asQuestion, didYouMean, search, suggest, type Suggestion } from '../lib/search';

/**
 * The Support home, after the shape of Figma's help center: a banded hero with
 * the one question and a big search box; topics to browse; the articles people
 * open most; and, last, who to ask when the answer isn't here.
 *
 * Search is done in the page — there is no server, and with a handful of posts none
 * is needed (`lib/search.ts`). It takes a person's own words ("why is this happening"),
 * ranks the best post first, and knows the questions Pam has no post for yet. Typing
 * replaces the sections below the hero with the matches, as a help center does; when
 * nothing matches the page says so and keeps the topics and a way to a person.
 */
/** The first posts are the ones people get stuck on most (the help-centre audit, D-458), so they lead. */
const START_HERE = 6;

const styles = stylex.create({
  band: { paddingBlock: '56px' },
  title: { maxWidth: '20ch' },
  search: { maxWidth: '640px', width: '100%' },
  meant: { flexWrap: 'wrap' },
});

/**
 * A list of posts: the title as a link and the summary under it, each wrapping to as many
 * lines as it needs. (Astryx's list item trims a label to one line with "…", which cut
 * the long titles off: language-fit audit, 10 October.)
 */
function PostList({ posts }: { readonly posts: readonly SupportPost[] }) {
  return (
    <VStack gap={3}>
      {posts.map((post, i) => (
        <VStack key={post.slug} gap={1}>
          {i > 0 ? <Divider /> : null}
          <VStack>
            <Link href={`/support/${post.slug}/`} hasUnderline isStandalone xstyle={tap.link}>
              {post.title}
            </Link>
          </VStack>
          <Text type="supporting" as="p">
            {post.summary}
          </Text>
        </VStack>
      ))}
    </VStack>
  );
}

/** Browse by topic: one card per kind of person, each with its posts. Shown on the Support home and under a search that found nothing. */
function Topics() {
  return (
      <VStack gap={4} paddingBlockStart={6}>
        <Heading level={2}>Browse by topic</Heading>
        <Grid columns={{ minWidth: 260 }} gap={4}>
          {TOPICS.map((topic) => {
            const posts = POSTS.filter((p) => p.topic === topic.id);
            return (
              <Card key={topic.id} id={`topic-${topic.id}`} padding={6} variant={posts.length ? 'default' : 'muted'}>
                <VStack gap={2}>
                  <Heading level={3}>{topic.title}</Heading>
                  <Text as="p">{topic.blurb}</Text>
                  {posts.length ? (
                    <VStack gap={1}>
                      {posts.map((p) => (
                        <VStack key={p.slug}>
                          <Link href={`/support/${p.slug}/`} hasUnderline isStandalone xstyle={tap.link}>
                            {p.title}
                          </Link>
                        </VStack>
                      ))}
                    </VStack>
                  ) : (
                    <Text type="supporting">Articles coming soon.</Text>
                  )}
                </VStack>
              </Card>
            );
          })}
        </Grid>
      </VStack>
  );
}

/** The suggestions under the box, in the shape the search bar takes. */
type SuggestionItem = { readonly id: string; readonly label: string; readonly description: string; readonly auxiliaryData: Suggestion };
const SOURCE: SearchSource<SuggestionItem> = {
  search: async (text) => {
    const rows = suggest(POSTS, text).map((s) => ({ id: s.id, label: s.label, description: s.description, auxiliaryData: s }));
    // Never an empty list (a listbox with no options is not valid, and says nothing): when no known question starts
    // that way, the one row is to search for the words as typed, which is what the results below already do.
    if (!rows.length && text.trim()) {
      const t = text.trim();
      return [{ id: 'search', label: `Search for “${t}”`, description: 'See every article that matches', auxiliaryData: { id: 'search', label: t, description: '', query: t, slug: '' } }];
    }
    return rows;
  },
  bootstrap: () => [],
};

/** The questions people ask most, each linking straight to its answer. */
function MostAsked() {
  const rows = MOST_ASKED.flatMap((phrase) => {
    const p = SEARCH_PHRASES.find((x) => x.phrase === phrase);
    const post = p?.answer ? POSTS.find((x) => x.slug === p.answer) : undefined;
    return p && post ? [{ phrase, post }] : [];
  });
  if (!rows.length) return null;
  return (
    <VStack gap={3}>
      <Heading level={2}>Most asked</Heading>
      <VStack gap={1}>
        {rows.map(({ phrase, post }) => (
          <VStack key={phrase}>
            <Link href={`/support/${post.slug}/`} hasUnderline isStandalone xstyle={tap.link}>
              {asQuestion(phrase)}
            </Link>
          </VStack>
        ))}
      </VStack>
    </VStack>
  );
}

/** A value that follows another after it has been still for `ms`: the status line below says a count, not every keystroke. */
function useSettled<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(handle);
  }, [value, ms]);
  return settled;
}

export function SupportScreen() {
  const [typed, setTyped] = useState('');
  // The search lives in the address (`?q=`), so Back from an article, a reload and a shared link all bring it back.
  const [restored, setRestored] = useState('');
  const [clearSignal, setClearSignal] = useState(0);
  const ready = useRef(false);
  // A question picked from the suggestions stands in for what was typed until the next keystroke.
  const [picked, setPicked] = useState<string | null>(null);
  const q = (picked ?? typed).trim();
  const { posts: found, gap } = useMemo(() => (q ? search(POSTS, q) : { posts: [], gap: null }), [q]);
  const meant = useMemo(() => (q && !found.length && !gap ? didYouMean(POSTS, q) : []), [q, found.length, gap]);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('q')?.trim() ?? '';
    if (fromUrl) {
      setRestored(fromUrl);
      setPicked(fromUrl);
    }
    ready.current = true;
  }, []);
  useEffect(() => {
    if (!ready.current) return;
    const next = q ? `${window.location.pathname}?q=${encodeURIComponent(q)}` : window.location.pathname;
    if (next !== window.location.pathname + window.location.search) window.history.replaceState(window.history.state, '', next);
  }, [q]);

  // What a screen reader hears: how many results, once the typing has paused. The list itself is not a live region.
  const heard = useSettled(q ? (found.length ? `${found.length} ${found.length === 1 ? 'result' : 'results'} for ${q}` : `No results for ${q}`) : '', 700);

  return (
    <>
      <Section variant="muted">
        <Frame gap={4}>
          <VStack gap={4} xstyle={styles.band}>
            <Heading level={1} type="display-2" xstyle={styles.title}>
              How can we help?
            </Heading>
            <Text type="large" color="secondary">
              How Pam works, in plain language: who can do what, and why.
            </Text>
            <VStack
              xstyle={styles.search}
              role="search"
              aria-label="Support"
              onKeyDown={(e: React.KeyboardEvent) => {
                // Esc closes the suggestions first (the box handles that); with them closed it empties the search.
                if (e.key === 'Escape' && q && !(e.target as HTMLElement).closest('[aria-expanded="true"]')) setClearSignal((n) => n + 1);
              }}
            >
              <SearchPill<SuggestionItem>
                key={restored || 'blank'}
                initialQuery={restored}
                clearSignal={clearSignal}
                label="Search Support"
                placeholder="Ask a question, for example “why didn’t I get a code?”"
                searchSource={SOURCE}
                onPick={(item) => setPicked(item.auxiliaryData.query)}
                onQuery={(v) => {
                  setTyped(v);
                  setPicked(null);
                }}
                emptyText="No suggested questions. The results below follow your words."
                clearLabel="Clear search"
              />
            </VStack>
          </VStack>
        </Frame>
      </Section>

      <Frame gap={8}>
        <VisuallyHidden role="status" aria-live="polite">
          {heard}
        </VisuallyHidden>
        {q ? (
          <VStack gap={3} paddingBlockStart={6}>
            <Heading level={2}>
              {found.length === 0 ? 'No results' : `${found.length} ${found.length === 1 ? 'result' : 'results'}`} for “{q}”
            </Heading>
            {gap || found.length === 0 ? (
              <Text as="p">We do not have an article for that yet.{found.length ? ' These may be close:' : ''}</Text>
            ) : null}
            {found.length ? <PostList posts={found} /> : null}
            {meant.length ? (
              <VStack gap={2}>
                <Text as="p">Did you mean:</Text>
                <HStack gap={2} xstyle={styles.meant}>
                  {meant.map((m) => (
                    <SecondaryButton key={m.id} label={m.label} onClick={() => setPicked(m.query)} />
                  ))}
                </HStack>
              </VStack>
            ) : null}
            {found.length === 0 ? <Topics /> : null}
          </VStack>
        ) : (
          <>
            <MostAsked />

            <Topics />

            <VStack gap={3}>
              <Heading level={2}>Start here</Heading>
              <PostList posts={POSTS.slice(0, START_HERE)} />
            </VStack>
          </>
        )}

        <StillStuck />
      </Frame>
    </>
  );
}
