'use client';

import { useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { List, ListItem } from '@astryxdesign/core/List';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { Button } from '@pam/ui/Button';
import { POSTS, type SupportPost } from '../content/posts';
import { TOPICS } from '../content/topics';
import { APP_URL } from '../lib/links';
import { Frame } from '../components/Frame';

/**
 * The Support home, after the shape of Figma's help center: a banded hero with
 * the one question and a big search box; topics to browse; the articles people
 * open most; and, last, who to ask when the answer isn't here.
 *
 * Search is a filter over the posts, done in the page — there is no server, and
 * with a handful of posts none is needed. Typing replaces the sections below the
 * hero with the matches, as a help center does.
 */
const styles = stylex.create({
  band: { paddingBlock: '56px' },
  title: { maxWidth: '20ch' },
  search: { maxWidth: '640px' },
});

function matches(post: SupportPost, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hay = [post.title, post.summary, ...post.keywords].join(' ').toLowerCase();
  return words.every((w) => hay.includes(w));
}

function PostList({ posts }: { readonly posts: readonly SupportPost[] }) {
  return (
    <List hasDividers>
      {posts.map((post) => (
        <ListItem
          key={post.slug}
          label={post.title}
          description={post.summary}
          href={`/support/${post.slug}/`}
        />
      ))}
    </List>
  );
}

export function SupportScreen() {
  const [query, setQuery] = useState('');
  const q = query.trim();
  const found = useMemo(() => (q ? POSTS.filter((p) => matches(p, q)) : []), [q]);

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
            <Card padding={2} elevation="med" xstyle={styles.search}>
              <TextInput
                label="Search Support"
                isLabelHidden
                placeholder="Search, for example “limit” or “unassigned”"
                size="lg"
                value={query}
                onChange={setQuery}
                hasClear
                width="100%"
              />
            </Card>
          </VStack>
        </Frame>
      </Section>

      <Frame gap={8}>
        {q ? (
          <VStack gap={3} paddingBlockStart={6} aria-live="polite">
            <Heading level={2}>
              {found.length === 0 ? 'No results' : `${found.length} ${found.length === 1 ? 'result' : 'results'}`} for “{q}”
            </Heading>
            {found.length ? (
              <PostList posts={found} />
            ) : (
              <Text as="p">
                Nothing matches yet. Try a shorter word, or ask the person who invited you to Pam.
              </Text>
            )}
          </VStack>
        ) : (
          <>
            <VStack gap={4} paddingBlockStart={6}>
              <Heading level={2}>Browse by topic</Heading>
              <Grid columns={{ minWidth: 260 }} gap={4}>
                {TOPICS.map((topic) => {
                  const posts = POSTS.filter((p) => p.topic === topic.id);
                  return (
                    <Card key={topic.id} padding={6} variant={posts.length ? 'default' : 'muted'}>
                      <VStack gap={2}>
                        <Heading level={3}>{topic.title}</Heading>
                        <Text as="p">{topic.blurb}</Text>
                        {posts.length ? (
                          <List>
                            {posts.map((p) => (
                              <ListItem key={p.slug} label={p.title} href={`/support/${p.slug}/`} />
                            ))}
                          </List>
                        ) : (
                          <Text type="supporting">Articles coming soon.</Text>
                        )}
                      </VStack>
                    </Card>
                  );
                })}
              </Grid>
            </VStack>

            <VStack gap={3}>
              <Heading level={2}>Popular articles</Heading>
              <PostList posts={POSTS} />
            </VStack>
          </>
        )}

        <Card padding={8} variant="muted">
          <VStack gap={3}>
            <Heading level={2}>Still need help?</Heading>
            <Text as="p">
              Ask the person who invited you to Pam, or a staff member who guides you. Inside the app,
              the Help button is always on screen.
            </Text>
            <HStack>
              <Button label="Open Pam" variant="secondary" href={APP_URL} />
            </HStack>
          </VStack>
        </Card>
      </Frame>
    </>
  );
}
