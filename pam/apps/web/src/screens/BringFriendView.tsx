'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { POINTS_RULES } from '@pam/config';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { BigButton, StarIcon } from '@pam/ui';
import { ProgramVisitCard } from '@pam/ui/ProgramVisitCard';
import { SubPage } from '@pam/ui/SubPage';
import { ToneGround } from '@pam/ui/Tone';
import { useI18n } from '@/lib/i18n';
import { friendLink } from '@/lib/appUrl';
import { CategoryIcon, categoryTone } from './SavedView';

/**
 * Bring a friend (D-329, D-330, Will, 6 October: "How can we make the bring
 * a friend nested screen more attractive?"). An invitation, not a form:
 *
 * - **The program and the two of you first**: `ProgramVisitCard`'s invite
 *   variant (D-332) — the program's picture in its colour, you and an empty
 *   "+" beside it, on its pale shade. "You two, at this place".
 * - **One warm sentence**, and what it is worth: +150 points when they join.
 * - **What they'll get**: the text as it will arrive — a bubble and a link
 *   card with the program's name — instead of a raw address. Somebody wary
 *   of sharing sees exactly what goes out.
 * - **One button**. Sent (or copied, where there is no share sheet), it says
 *   so and bursts, like a check-in on Program Home (D-316).
 */
const fly = stylex.keyframes({
  '0%': { transform: 'translate(0, 0) scale(1)', opacity: 1 },
  '70%': { opacity: 1 },
  '100%': { transform: 'translate(var(--dx), var(--dy)) scale(0.2)', opacity: 0 },
});
const BURST: readonly { readonly dx: number; readonly dy: number; readonly tone: string; readonly size: number }[] = [
  { dx: 70, dy: -44, tone: 'var(--color-data-shamrock-3)', size: 8 },
  { dx: -64, dy: -48, tone: 'var(--color-data-yellow-3)', size: 7 },
  { dx: 120, dy: -18, tone: 'var(--color-data-orange-3)', size: 6 },
  { dx: -118, dy: -14, tone: 'var(--color-data-blue-3)', size: 7 },
  { dx: 30, dy: -62, tone: 'var(--color-data-purple-3)', size: 6 },
  { dx: -24, dy: -60, tone: 'var(--color-data-shamrock-4)', size: 8 },
  { dx: 150, dy: -40, tone: 'var(--color-data-red-3)', size: 5 },
  { dx: -150, dy: -38, tone: 'var(--color-data-yellow-4)', size: 6 },
];

const ART = { width: 36, height: 36, 'aria-hidden': true } as const;
const SMALL_ART = { width: 24, height: 24, 'aria-hidden': true } as const;

// The ToneGround's pale shade, as a fill (see @pam/ui/Tone).
const bubbleTone = stylex.create({
  blue: { backgroundColor: 'var(--color-data-blue-1)' },
  green: { backgroundColor: 'var(--color-data-shamrock-1)' },
  purple: { backgroundColor: 'var(--color-data-purple-1)' },
  orange: { backgroundColor: 'var(--color-data-orange-1)' },
  red: { backgroundColor: 'var(--color-data-red-1)' },
  teal: { backgroundColor: 'var(--color-data-teal-1)' },
  pink: { backgroundColor: 'var(--color-data-pink-1)' },
  cyan: { backgroundColor: 'var(--color-data-teal-1)' },
  gray: { backgroundColor: 'var(--color-data-gray-1)' },
});

const styles = stylex.create({
  // Narrow, so the sentence breaks into even lines (Will, 6 October).
  body: { fontSize: '18px', lineHeight: 1.45, textAlign: 'center', alignSelf: 'center', maxWidth: '300px' },
  worth: {
    alignSelf: 'center',
    paddingBlock: '8px',
    paddingInline: '14px',
    borderRadius: '999px',
    backgroundColor: colorVars['--color-accent-muted'],
    color: colorVars['--color-text-accent'],
  },
  worthText: { fontSize: '16px', fontWeight: 600, color: 'inherit' },
  previewLabel: { fontSize: '15px', fontWeight: 600, paddingBlockStart: '8px', textAlign: 'center' },
  // The text as it arrives, centred and in the program's own pale colour
  // (Will, 6 October): the card first, the words under it.
  bubble: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: '340px',
    padding: '12px',
    borderRadius: '22px',
    backgroundColor: colorVars['--color-background-muted'],
  },
  bubbleText: {
    fontSize: '17px',
    lineHeight: 1.35,
    paddingInline: '4px',
    paddingBlockEnd: '2px',
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: '250px',
  },
  linkCard: {
    padding: '10px',
    borderRadius: '16px',
    backgroundColor: colorVars['--color-background-body'],
  },
  linkArt: {
    width: '48px',
    height: '48px',
    flexShrink: 0,
    borderRadius: '10px',
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
    color: colorVars['--color-icon-accent'],
  },
  linkWords: { minWidth: 0 },
  linkName: { fontSize: '16px', fontWeight: 700, lineHeight: 1.25 },
  linkHint: { fontSize: '14px', lineHeight: 1.3 },
  send: { position: 'relative', width: '100%' },
  burst: { position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' },
  bit: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    borderRadius: '2px',
    marginTop: '-3px',
    marginLeft: '-3px',
    animationName: fly,
    animationDuration: '700ms',
    animationTimingFunction: 'cubic-bezier(0.15, 0.7, 0.3, 1)',
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': { animationName: 'none', opacity: 0 },
  },
  bitPlace: (dx: number, dy: number, tone: string, size: number) => ({
    '--dx': `${dx}px`,
    '--dy': `${dy}px`,
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: tone,
  }),
});

export function friendHref(placeId: string, placeName: string, category?: string | null): string {
  const query = new URLSearchParams({ id: placeId, name: placeName, ...(category ? { cat: category } : {}) });
  return `/place/friend/?${query.toString()}`;
}

export function BringFriendScreen({
  placeId,
  placeName,
  category = null,
}: {
  readonly placeId: string;
  readonly placeName: string;
  /** The program's category, for its picture; looked up for an example place. */
  readonly category?: string | null;
}) {
  const { t } = useI18n();
  const [sent, setSent] = useState<'sent' | 'copied' | null>(null);
  const [burst, setBurst] = useState(0);
  const url = friendLink(placeId);
  const kind = category ?? DUMMY_PLACES_BY_ID[placeId]?.category ?? 'education';
  const tone = categoryTone(kind);
  const points = POINTS_RULES.refer_someone.points;

  const done = (how: 'sent' | 'copied') => {
    setSent(how);
    setBurst((n) => n + 1);
  };

  const send = async () => {
    const text = t('friend.message', { place: placeName, url });
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ text });
        done('sent');
        return;
      }
    } catch {
      // Closed the sheet, or sharing is blocked: copy instead.
    }
    try {
      await navigator.clipboard?.writeText(url);
      done('copied');
    } catch {
      // No clipboard either; nothing was sent, so nothing celebrates.
    }
  };

  return (
    <SubPage
      title={t('friend.title')}
      subtitle={placeName || undefined}
      backHref={`/place/?id=${encodeURIComponent(placeId)}`}
      backLabel={t('nav.back.place')}
      // The one button rides the foot of the screen (D-326).
      footer={
        <VStack xstyle={styles.send}>
          <BigButton
            label={sent === 'copied' ? t('invite.link.copied') : sent === 'sent' ? `${t('friend.sent')} ✓` : t('invite.link.share')}
            onPress={() => void send()}
          />
          {burst > 0 ? (
            <HStack key={burst} aria-hidden xstyle={styles.burst}>
              {BURST.map((b, i) => (
                <HStack key={i} xstyle={[styles.bit, styles.bitPlace(b.dx, b.dy, b.tone, b.size)]} />
              ))}
            </HStack>
          ) : null}
        </VStack>
      }
    >
      <VStack gap={4}>
        {/* The program and the two of you, as one card (D-332). */}
        <ProgramVisitCard
          variant="invite"
          name={placeName}
          tone={tone}
          art={<CategoryIcon category={kind} iconSize={ART} isBaked />}
        />

        <Text xstyle={styles.body}>{t('friend.body', { place: placeName })}</Text>

        <HStack gap={2} align="center" xstyle={styles.worth}>
          <StarIcon width={20} height={20} aria-hidden />
          <Text xstyle={styles.worthText}>{t('friend.points', { count: points })}</Text>
        </HStack>

        <VStack gap={2}>
          <Text type="supporting" xstyle={styles.previewLabel}>
            {t('friend.preview')}
          </Text>
          <VStack gap={2} xstyle={[styles.bubble, tone ? bubbleTone[tone] : null]}>
            <HStack gap={3} align="center" wrap="nowrap" xstyle={styles.linkCard} aria-label={t('invite.link.label')}>
              <HStack align="center" justify="center" xstyle={styles.linkArt}>
                <ToneGround tone={tone} />
                <CategoryIcon category={kind} iconSize={SMALL_ART} isBaked />
              </HStack>
              <VStack gap={0.5} xstyle={styles.linkWords}>
                <Text xstyle={styles.linkName}>{placeName}</Text>
                <Text type="supporting" xstyle={styles.linkHint}>
                  {t('friend.preview.link')}
                </Text>
              </VStack>
            </HStack>
            <Text xstyle={styles.bubbleText}>{t('friend.bubble', { place: placeName })}</Text>
          </VStack>
        </VStack>
      </VStack>
    </SubPage>
  );
}
