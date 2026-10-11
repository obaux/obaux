'use client';

import { useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Divider } from '@astryxdesign/core/Divider';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { SecondaryButton } from '../components/SecondaryButton';
import { Link } from '@astryxdesign/core/Link';
import { POSTS, type SupportPost } from '../content/posts';
import { TOPICS } from '../content/topics';
import { APP_URL } from '../lib/links';
import { Frame } from '../components/Frame';
import { StillStuck } from '../components/StillStuck';
import { search } from '../lib/search';

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
  search: { maxWidth: '640px' },
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
          <VStack paddingBlock={1}>
            <Link href={`/support/${post.slug}/`} hasUnderline isStandalone>
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
              <Card key={topic.id} padding={6} variant={posts.length ? 'default' : 'muted'}>
                <VStack gap={2}>
                  <Heading level={3}>{topic.title}</Heading>
                  <Text as="p">{topic.blurb}</Text>
                  {posts.length ? (
                    <VStack gap={1}>
                      {posts.map((p) => (
                        <VStack key={p.slug} paddingBlock={1}>
                          <Link href={`/support/${p.slug}/`} hasUnderline isStandalone>
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

export function SupportScreen() {
  const [query, setQuery] = useState('');
  const q = query.trim();
  const { posts: found, gap } = useMemo(() => (q ? search(POSTS, q) : { posts: [], gap: null }), [q]);

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
                placeholder="Search, for example “limit” or “reason”"
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
            {gap ? (
              <Text as="p">We do not have an article for that yet. {found.length ? 'These may be close:' : 'You can ask a person below.'}</Text>
            ) : null}
            {found.length ? (
              <PostList posts={found} />
            ) : gap ? null : (
              <Text as="p">
                Nothing matched “{q}”. Try fewer or shorter words, look through the topics below, or ask a person.
              </Text>
            )}
            {found.length === 0 ? <Topics /> : null}
          </VStack>
        ) : (
          <>
            <Topics />

            <VStack gap={3}>
              <Heading level={2}>Start here</Heading>
              <PostList posts={POSTS.slice(0, START_HERE)} />
            </VStack>
          </>
        )}

        {q && found.length === 0 ? (
          <StillStuck />
        ) : (
          <Card padding={8} variant="muted">
            <VStack gap={3}>
              <Heading level={2}>Still need help?</Heading>
              <Text as="p">
                Ask the person who invited you to Pam, or a staff member who guides you. Inside the app,
                the Help button is always on screen.
              </Text>
              <HStack>
                <SecondaryButton label="Open Pam" href={APP_URL} />
              </HStack>
            </VStack>
          </Card>
        )}
      </Frame>
    </>
  );
}
