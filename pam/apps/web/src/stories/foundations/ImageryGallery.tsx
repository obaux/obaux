import { useRef, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BADGES, CATEGORIES, type Category } from '@pam/config';
import { BADGE_ART_KEYS, BadgeArt, ConnectionsArt } from '@pam/ui/BadgeArt';
import { CategoryArt } from '@pam/ui/CategoryArt';
import { SETUP_ART_KINDS, SetupArt, type SetupArtKind } from '@pam/ui/SetupArt';
import { TextLink } from '@pam/ui';
import { BRAND, PEOPLE, PHOTOGRAPHS, type ImageryItem } from './imagery';

/**
 * The imagery inventory for Foundations › Imagery (Will, 7 October: "keep
 * inventory of all illustrations … bring in photos and treat it all under
 * storybook for easy handoff"). The vector sets are drawn from the code's own
 * lists — `SETUP_ART_KINDS`, `CATEGORIES`, `BADGE_ART_KEYS` — and the files
 * from `imagery.ts`, which a test keeps in step with `public/`. Every item
 * can be downloaded: a file as it ships, a vector picture as an SVG with its
 * colours written in.
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
  mark: { width: '100%', maxWidth: '220px', display: 'block', padding: '24px', borderRadius: '16px', backgroundColor: colorVars['--color-background-muted'], boxSizing: 'border-box' },
  onDark: { backgroundColor: '#1F2421' },
  person: { width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', display: 'block' },
  warn: { fontSize: '13px', lineHeight: 1.4, color: colorVars['--color-warning'] },
});

/** The properties a picture's look depends on, written onto each element. */
const PAINT = ['fill', 'fill-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'mix-blend-mode'] as const;

/**
 * A vector picture as a file a designer can open: its colours come from
 * StyleX classes and theme variables, which mean nothing outside the app, so
 * each element's computed paint is written onto it before it is saved.
 */
function downloadSvg(host: HTMLElement | null, name: string) {
  const svg = host?.querySelector('svg');
  if (!svg) return;
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const from = [svg, ...svg.querySelectorAll('*')];
  const to = [copy, ...copy.querySelectorAll('*')];
  from.forEach((element, i) => {
    const target = to[i] as Element;
    const computed = getComputedStyle(element);
    const style = PAINT.map((property) => `${property}:${computed.getPropertyValue(property)}`).join(';');
    target.setAttribute('style', style);
    target.removeAttribute('class');
  });
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', '512');
  copy.setAttribute('height', '512');
  const blob = new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `pam-${name}.svg`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function Tile({ art, name, code, note, file }: { art: ReactNode; name: string; code: string; note?: string; file?: string }) {
  const host = useRef<HTMLElement>(null);
  return (
    <VStack gap={1} xstyle={styles.tile}>
      <HStack ref={host}>{art}</HStack>
      <Text xstyle={styles.name}>{name}</Text>
      <Text xstyle={styles.code}>{code}</Text>
      {note ? <Text xstyle={styles.note}>{note}</Text> : null}
      {file ? <TextLink label="Download SVG" onClick={() => downloadSvg(host.current, file)} size="quiet" /> : null}
    </VStack>
  );
}

/** A shipped file: shown, its path, and a link that downloads it as it ships. */
function FileTile({ item, children }: { item: ImageryItem; children: ReactNode }) {
  const files = [item.src, ...(item.alsoAt ?? [])];
  return (
    <VStack gap={1} xstyle={styles.tile}>
      {children}
      <Text xstyle={styles.name}>{item.name}</Text>
      {files.map((src) => (
        <Text key={src} xstyle={styles.code}>
          public{src}
        </Text>
      ))}
      <Text xstyle={styles.note}>{item.note}</Text>
      {files.map((src) => (
        <Link key={src} href={src} download>
          {files.length > 1 ? `Download ${src.split('/').pop()}` : 'Download'}
        </Link>
      ))}
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
          file={`setup-${kind}`}
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
          file={`category-${category}`}
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
          file={`badge-${key}`}
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
        file="connections"
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

/** Photographs and commissioned art, served from `apps/web/public`. */
export function PhotoSet() {
  return (
    <HStack xstyle={styles.grid}>
      {PHOTOGRAPHS.map((item) => (
        <FileTile key={item.src} item={item}>
          <img src={item.src} alt="" {...stylex.props(styles.photo)} />
        </FileTile>
      ))}
    </HStack>
  );
}

/** The wordmarks and the email logo. */
export function BrandSet() {
  return (
    <HStack xstyle={styles.grid}>
      {BRAND.map((item) => (
        <FileTile key={item.src} item={item}>
          <img src={item.src} alt="" {...stylex.props(styles.mark, item.isOnDark && styles.onDark)} />
        </FileTile>
      ))}
    </HStack>
  );
}

/** Example people (D-335) — still linked from Unsplash, not in the repo yet. */
export function PeopleSet() {
  return (
    <HStack xstyle={styles.grid}>
      {PEOPLE.map((person) => (
        <VStack key={person.src} gap={1} xstyle={styles.tile}>
          <img src={person.src} alt="" {...stylex.props(styles.person)} />
          <Text xstyle={styles.name}>{person.name}</Text>
          <Text xstyle={styles.note}>{person.note}</Text>
          <Text xstyle={styles.warn}>Linked from Unsplash — not in the repo yet</Text>
          <Link href={person.src} isExternalLink>
            Open original
          </Link>
        </VStack>
      ))}
    </HStack>
  );
}
