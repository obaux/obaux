import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BADGES, CATEGORIES, type Category } from '@pam/config';
import { BADGE_ART_KEYS, BadgeArt, ConnectionsArt } from '@pam/ui/BadgeArt';
import { CategoryArt } from '@pam/ui/CategoryArt';
import { SETUP_ART_KINDS, SetupArt, type SetupArtKind } from '@pam/ui/SetupArt';

/**
 * The illustration inventory for Foundations › Illustrations (Will,
 * 7 October). Every set is drawn from the code's own lists —
 * `SETUP_ART_KINDS`, `CATEGORIES`, `BADGE_ART_KEYS` — so a new picture shows
 * up here the moment it exists, and nothing can be left off.
 */
const styles = stylex.create({
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px', width: '100%' },
  tile: { alignItems: 'flex-start' },
  art: { borderRadius: '16px', overflow: 'hidden' },
  round: { borderRadius: '50%', overflow: 'hidden' },
  name: { fontSize: '15px', fontWeight: 600, lineHeight: 1.3 },
  note: { fontSize: '13px', lineHeight: 1.4, color: colorVars['--color-text-secondary'] },
  code: { fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: colorVars['--color-text-secondary'] },
  hero: {
    position: 'relative',
    width: '100%',
    maxWidth: '390px',
    height: '240px',
    overflow: 'hidden',
    borderRadius: '16px',
    display: 'flex',
  },
  photo: { width: '100%', maxWidth: '320px', borderRadius: '16px', display: 'block' },
});

function Tile({ art, name, code, note }: { art: ReactNode; name: string; code: string; note?: string }) {
  return (
    <VStack gap={1} xstyle={styles.tile}>
      {art}
      <Text xstyle={styles.name}>{name}</Text>
      <Text xstyle={styles.code}>{code}</Text>
      {note ? <Text xstyle={styles.note}>{note}</Text> : null}
    </VStack>
  );
}

/** Where each getting-started picture is used, and its decision. */
const SETUP_NOTES: Readonly<Record<SetupArtKind, string>> = {
  program: 'Get started: Add your program (D-352)',
  photo: 'Get started: Add your photo (D-352)',
  calendar: 'Get started: See who is coming in (D-352)',
  message: 'What to expect, programs (D-354)',
  policy: 'What to expect, programs (D-354)',
  private: 'What to expect, programs (D-354)',
  alerts: 'Profile: text alerts card (D-360)',
  switch: 'Hero of Add your program to your account (D-376)',
};

const CATEGORY_NAMES: Readonly<Record<Category, string>> = {
  education: 'School and training',
  workforce: 'Work and money',
  family_services: 'Home and family',
};

export function SetupSet() {
  return (
    <HStack xstyle={styles.grid}>
      {SETUP_ART_KINDS.map((kind) => (
        <Tile
          key={kind}
          art={
            <HStack xstyle={styles.art}>
              <SetupArt kind={kind} size={96} />
            </HStack>
          }
          name={kind[0]!.toUpperCase() + kind.slice(1)}
          code={`<SetupArt kind="${kind}" />`}
          note={SETUP_NOTES[kind]}
        />
      ))}
    </HStack>
  );
}

export function CategorySet() {
  return (
    <HStack xstyle={styles.grid}>
      {CATEGORIES.map((category) => (
        <Tile
          key={category}
          art={
            <HStack xstyle={styles.art}>
              <CategoryArt category={category} size={96} />
            </HStack>
          }
          name={CATEGORY_NAMES[category]}
          code={`<CategoryArt category="${category}" />`}
          note="Place cards, Explore chips, Saved (D-287, D-301, D-302)"
        />
      ))}
    </HStack>
  );
}

export function BadgeSet() {
  return (
    <HStack xstyle={styles.grid}>
      {BADGE_ART_KEYS.map((key) => (
        <Tile
          key={key}
          art={
            <HStack xstyle={styles.round}>
              <BadgeArt badgeKey={key} size={96} />
            </HStack>
          }
          name={BADGES.find((b) => b.key === key)?.name ?? key}
          code={`<BadgeArt badgeKey="${key}" />`}
        />
      ))}
      <Tile
        art={
          <HStack xstyle={styles.art}>
            <ConnectionsArt size={96} />
          </HStack>
        }
        name="Connections"
        code="<ConnectionsArt />"
        note="Profile: Connections tile (D-295)"
      />
    </HStack>
  );
}

export function LockedBadge() {
  return (
    <HStack gap={4}>
      <Tile
        art={
          <HStack xstyle={styles.round}>
            <BadgeArt badgeKey="scholar" size={96} isLocked />
          </HStack>
        }
        name="Not earned yet"
        code={'<BadgeArt isLocked />'}
      />
      <Tile
        art={
          <HStack xstyle={styles.art}>
            <BadgeArt badgeKey="rooted" size={96} shape="square" />
          </HStack>
        }
        name="Square, on a tile"
        code={'<BadgeArt shape="square" />'}
      />
    </HStack>
  );
}

export function HeroSample() {
  return (
    <HStack xstyle={styles.hero}>
      <SetupArt kind="switch" isHero />
    </HStack>
  );
}

/** The photographs and raster art, served from `apps/web/public`. */
const PHOTOS = [
  { src: '/onboarding/hero-city.webp', name: 'Sign in, slide 1', note: 'A place to look (D-135)' },
  { src: '/onboarding/hero-phone.webp', name: 'Sign in, slide 2', note: 'A person to ask (D-135)' },
  { src: '/onboarding/hero-sneakers.webp', name: 'Sign in, slide 3', note: 'A plan to go (D-135)' },
  { src: '/friend/bring-a-friend-800.webp', name: 'Bring a friend', note: 'The friend drawer (D-337)' },
  { src: '/og/invite.jpg', name: 'Invite link preview', note: 'Shown when a link is pasted into a text (D-263)' },
] as const;

export function PhotoSet() {
  return (
    <HStack xstyle={styles.grid}>
      {PHOTOS.map((photo) => (
        <VStack key={photo.src} gap={1} xstyle={styles.tile}>
          <img src={photo.src} alt="" {...stylex.props(styles.photo)} />
          <Text xstyle={styles.name}>{photo.name}</Text>
          <Text xstyle={styles.code}>{photo.src}</Text>
          <Text xstyle={styles.note}>{photo.note}</Text>
        </VStack>
      ))}
    </HStack>
  );
}
