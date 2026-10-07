import { useRef, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { CameraIcon } from './icons.js';
import { pam } from './tokens.stylex.js';

/**
 * The Profile screen's cards (D-210): who you are, the two doors beside each
 * other, and a single offer. Modelled on the reference Will gave on 1 October —
 * white page, generous rounded cards lifted by the theme's card shadow, very
 * little text on each — and kept to Pam's floors: 48px targets, 18px body.
 */

// ---------------------------------------------------------------------------
// Who you are

export interface ProfileStat {
  readonly value: string;
  readonly label: string;
}

export interface ProfileSummaryProps {
  readonly name: string;
  /** "Member", "Case manager" — who Pam knows this account as. */
  readonly roleLabel: string;
  /** A photo, when there is one; otherwise the avatar shows initials. */
  readonly photoUrl?: string | null;
  /** Up to three, shown down the right-hand side. */
  readonly stats: readonly ProfileStat[];
  /**
   * One control in the card's top-right corner — the case manager's star on
   * a member's page (D-227, D-231).
   */
  readonly corner?: ReactNode;
  /** Beside the name — a program's verified tick on a member (D-261). */
  readonly nameAddon?: ReactNode;
  /**
   * Staff only (D-345): a small round camera button on the avatar's corner
   * that picks a photo. Given the file; the screen shrinks and uploads it.
   */
  readonly onPhotoPick?: (file: File) => void;
  /** The camera button's name: "Add a photo" / "Change your photo". */
  readonly photoLabel?: string;
  /** While a photo uploads: a spinner on the avatar, the button resting. */
  readonly isPhotoBusy?: boolean;
}

const summary = stylex.create({
  card: { width: '100%', position: 'relative' },
  corner: { position: 'absolute', top: '12px', insetInlineEnd: '12px' },
  person: { flexBasis: '55%', flexShrink: 0, minWidth: 0 },
  // No numbers to show (a staff account, D-217): the person has the card.
  personAlone: { flexBasis: '100%' },
  name: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700, textAlign: 'center' },
  role: { fontSize: '15px', textAlign: 'center' },
  stats: { flexGrow: 1, minWidth: 0 },
  // Clear of the corner control, which sits over the column's top.
  statsUnderCorner: { paddingBlockStart: '28px' },
  value: { fontSize: '20px', lineHeight: 1.2, fontWeight: 700 },
  avatar: { position: 'relative' },
  // A white, lifted circle on the avatar's lower right, the camera in the
  // accent colour. 48px, Pam's touch floor (§2.5), which is still small
  // beside the avatar.
  camera: {
    position: 'absolute',
    insetInlineEnd: '-6px',
    bottom: '-4px',
    width: pam['--pam-touch-target-min'],
    height: pam['--pam-touch-target-min'],
    minWidth: pam['--pam-touch-target-min'],
    padding: 0,
    borderRadius: '50%',
    backgroundColor: colorVars['--color-background-card'],
    color: colorVars['--color-text-accent'],
    boxShadow: '0 1px 4px light-dark(oklch(0 0 0 / 20%), oklch(0 0 0 / 50%))',
  },
  busy: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    backgroundColor: 'light-dark(oklch(1 0 0 / 70%), oklch(0 0 0 / 50%))',
  },
  // The file picker itself is never seen: the camera button opens it.
  fileInput: { position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' },
  label: { fontSize: '13px', lineHeight: 1.3 },
});

export function ProfileSummary({
  name,
  roleLabel,
  photoUrl,
  stats,
  corner,
  nameAddon,
  onPhotoPick,
  photoLabel,
  isPhotoBusy = false,
}: ProfileSummaryProps) {
  const picker = useRef<HTMLInputElement>(null);
  return (
    <Card padding={6} xstyle={summary.card}>
      {corner ? <HStack xstyle={summary.corner}>{corner}</HStack> : null}
      <HStack gap={4} align="center" wrap="nowrap">
        <VStack gap={2} align="center" xstyle={[summary.person, stats.length === 0 && summary.personAlone]}>
          <VStack xstyle={summary.avatar}>
            <Avatar size="xl" name={name} src={photoUrl ?? undefined} tooltip={false} />
            {isPhotoBusy ? (
              <HStack align="center" justify="center" xstyle={summary.busy}>
                <Spinner size="md" />
              </HStack>
            ) : null}
            {onPhotoPick && photoLabel ? (
              <>
                <IconButton
                  label={photoLabel}
                  variant="ghost"
                  isDisabled={isPhotoBusy}
                  onClick={() => picker.current?.click()}
                  icon={<CameraIcon width={22} height={22} aria-hidden />}
                  xstyle={summary.camera}
                />
                <input
                  ref={picker}
                  type="file"
                  accept="image/*"
                  tabIndex={-1}
                  aria-hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onPhotoPick(file);
                    event.target.value = '';
                  }}
                  {...stylex.props(summary.fileInput)}
                />
              </>
            ) : null}
          </VStack>
          <VStack gap={0.5} align="center">
            <HStack gap={0} align="center" justify="center" wrap="nowrap">
              <Heading level={2} xstyle={summary.name} maxLines={2}>
                {name}
              </Heading>
              {nameAddon}
            </HStack>
            <Text type="supporting" xstyle={summary.role}>
              {roleLabel}
            </Text>
          </VStack>
        </VStack>
        {stats.length > 0 ? (
          <VStack gap={3} xstyle={[summary.stats, corner ? summary.statsUnderCorner : null]}>
            {stats.slice(0, 3).map((stat, index) => (
              <VStack key={stat.label} gap={2}>
                {index > 0 ? <Divider /> : null}
                <VStack gap={0}>
                  <Text xstyle={summary.value}>{stat.value}</Text>
                  <Text type="supporting" xstyle={summary.label}>
                    {stat.label}
                  </Text>
                </VStack>
              </VStack>
            ))}
          </VStack>
        ) : null}
      </HStack>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Two doors side by side

export interface FeatureTileProps {
  readonly label: string;
  readonly href: string;
  /** Drawn large above the label — a Pam icon or an avatar stack. */
  readonly art: ReactNode;
  /**
   * A small ribbon across the foot of the art — "Your badge" on a member's
   * award tile (Will, 5 October, D-286), so "Rooted" reads as something
   * earned, not a place. Laid over the art, not under it, so this tile
   * stays exactly the shape of the one beside it.
   */
  readonly hint?: string;
}

const tile = stylex.create({
  card: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  art: {
    position: 'relative',
    width: '88px',
    height: '88px',
    borderRadius: '24px',
    fontSize: '44px',
    color: colorVars['--color-icon-accent'],
    backgroundColor: colorVars['--color-accent-muted'],
  },
  label: { fontSize: '18px', fontWeight: 600, textAlign: 'center' },
  hint: {
    position: 'absolute',
    bottom: '-9px',
    left: '50%',
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
    paddingInline: '8px',
    paddingBlock: '2px',
    borderRadius: '999px',
    fontSize: '11px',
    lineHeight: 1.4,
    fontWeight: 700,
    letterSpacing: '0.02em',
    color: colorVars['--color-text-accent'],
    backgroundColor: colorVars['--color-background-card'],
    boxShadow: '0 1px 3px light-dark(oklch(0 0 0 / 14%), oklch(0 0 0 / 50%))',
  },
});

export function FeatureTile({ label, href, art, hint }: FeatureTileProps) {
  return (
    <ClickableCard label={hint ? `${hint}: ${label}` : label} href={href} padding={4} xstyle={tile.card}>
      <VStack gap={3} align="center">
        <HStack align="center" justify="center" xstyle={tile.art}>
          {art}
          {hint ? (
            <Text aria-hidden xstyle={tile.hint}>
              {hint}
            </Text>
          ) : null}
        </HStack>
        <Text xstyle={tile.label}>{label}</Text>
      </VStack>
    </ClickableCard>
  );
}

/** Two `FeatureTile`s, side by side, sharing the row equally. */
export function FeatureTileRow({ children }: { readonly children: ReactNode }) {
  return (
    <HStack gap={3} align="stretch" wrap="nowrap">
      {children}
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// One offer

export interface PromoCardProps {
  readonly title: string;
  readonly body: string;
  readonly href: string;
  readonly art: ReactNode;
}

const promo = stylex.create({
  card: { width: '100%' },
  art: {
    width: '72px',
    height: '72px',
    flexShrink: 0,
    borderRadius: '16px',
    // An illustration fills the box edge to edge (D-360); an icon still
    // sits centred on the tint.
    overflow: 'hidden',
    fontSize: '36px',
    color: colorVars['--color-icon-accent'],
    backgroundColor: colorVars['--color-accent-muted'],
  },
  title: { fontSize: '18px', fontWeight: 700 },
  body: { fontSize: '16px', lineHeight: 1.4 },
});

export function PromoCard({ title, body, href, art }: PromoCardProps) {
  return (
    <ClickableCard label={title} href={href} padding={6} xstyle={promo.card}>
      <HStack gap={4} align="center" wrap="nowrap">
        <HStack align="center" justify="center" xstyle={promo.art}>
          {art}
        </HStack>
        <VStack gap={1}>
          <Text xstyle={promo.title}>{title}</Text>
          <Text type="supporting" xstyle={promo.body}>
            {body}
          </Text>
        </VStack>
      </HStack>
    </ClickableCard>
  );
}
