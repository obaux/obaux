'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';

/**
 * Shimmer placeholders shaped like the two things PAM asks somebody to wait
 * for most — a list of places or people, and one of either on its own screen
 * (Will, 16 September: skeletons for places and people, "only use the
 * spinner loading for other screens").
 *
 * `Loading`'s spinner says one true thing everywhere: something is happening.
 * That is the right answer for a screen with no shape yet — signing in,
 * account state, a support number resolving. A list is different: its reader
 * already knows the shape of what is coming (a name, a couple of facts, a
 * line of text, repeated a few times), and drawing that shape while it loads
 * reads as faster and jumps less into place than a ring that vanishes and
 * dumps the whole list in at once. See Astryx's own `Skeleton` doc: "use
 * Spinner instead" is explicitly for content whose *dimensions* are unknown,
 * which is the one thing not true of a list of cards PAM already knows the
 * size of.
 *
 * Each list is announced once, politely, through a hidden live region —
 * `VisuallyHidden as="div" aria-live="polite"` — rather than per row: a
 * screen reader hearing "Loading places" once is oriented; hearing it, or
 * silence, from four empty decorative shapes is not.
 */

const styles = stylex.create({
  card: { width: '100%' },
});

function PlaceCardSkeleton({ index }: { readonly index: number }) {
  const base = index * 4;
  return (
    <Card padding={4} xstyle={styles.card}>
      <VStack gap={2}>
        <Skeleton width="60%" height={20} index={base} />
        <HStack gap={2} align="center">
          <Skeleton width={56} height={14} index={base + 1} />
          <Skeleton width={96} height={14} index={base + 2} />
        </HStack>
        <Skeleton width="100%" height={14} index={base + 3} />
      </VStack>
    </Card>
  );
}

export interface SkeletonListProps {
  /** Announced once, e.g. "Loading places" / "Loading people" — never drawn. */
  readonly label: string;
  readonly count?: number;
}

/** The places list, while it loads — see `/places/` and the file comment. */
export function PlaceCardSkeletonList({ label, count = 3 }: SkeletonListProps) {
  return (
    <VStack gap={3}>
      <VisuallyHidden as="div" aria-live="polite">
        {label}
      </VisuallyHidden>
      {Array.from({ length: count }, (_, i) => (
        <PlaceCardSkeleton key={i} index={i} />
      ))}
    </VStack>
  );
}

function PersonRowSkeleton({ index }: { readonly index: number }) {
  const base = index * 3;
  return (
    <Card xstyle={styles.card}>
      <VStack gap={2}>
        <HStack gap={3} align="center">
          <Skeleton width={48} height={48} radius="rounded" index={base} />
          <Skeleton width="40%" height={20} index={base + 1} />
        </HStack>
        <Skeleton width={140} height={14} index={base + 2} />
      </VStack>
    </Card>
  );
}

/** A caseload, a directory, "who is interested" — see the file comment. */
export function PersonRowSkeletonList({ label, count = 3 }: SkeletonListProps) {
  return (
    <VStack gap={3}>
      <VisuallyHidden as="div" aria-live="polite">
        {label}
      </VisuallyHidden>
      {Array.from({ length: count }, (_, i) => (
        <PersonRowSkeleton key={i} index={i} />
      ))}
    </VStack>
  );
}

export interface SkeletonScreenProps {
  /** Announced once, e.g. "Loading this place" — never drawn. */
  readonly label: string;
}

/** A whole place, on its own screen, while `service_detail` is still in flight. */
export function PlaceDetailSkeleton({ label }: SkeletonScreenProps) {
  return (
    <VStack gap={4}>
      <VisuallyHidden as="div" aria-live="polite">
        {label}
      </VisuallyHidden>
      <VStack gap={2}>
        <Skeleton width="80%" height={26} index={0} />
        <Skeleton width={120} height={22} index={1} />
      </VStack>
      <Card padding={4} xstyle={styles.card}>
        <VStack gap={2}>
          <Skeleton width="100%" height={16} index={2} />
          <Skeleton width="90%" height={16} index={3} />
          <Skeleton width="70%" height={16} index={4} />
        </VStack>
      </Card>
      <Skeleton width="100%" height={64} radius={3} index={5} />
      <Card padding={4} xstyle={styles.card}>
        <Skeleton width="100%" height={16} index={6} />
      </Card>
    </VStack>
  );
}

/** One person's profile, while it loads — see `/person/`. */
export function PersonDetailSkeleton({ label }: SkeletonScreenProps) {
  return (
    <VStack gap={4}>
      <VisuallyHidden as="div" aria-live="polite">
        {label}
      </VisuallyHidden>
      <HStack gap={3} align="center">
        <Skeleton width={64} height={64} radius="rounded" index={0} />
        <VStack gap={1}>
          <Skeleton width={140} height={20} index={1} />
          <Skeleton width={100} height={14} index={2} />
        </VStack>
      </HStack>
      <Card padding={4} xstyle={styles.card}>
        <VStack gap={2}>
          <Skeleton width={160} height={18} index={3} />
          <Skeleton width="100%" height={14} index={4} />
          <Skeleton width="80%" height={14} index={5} />
        </VStack>
      </Card>
    </VStack>
  );
}
