'use client';

import type { ReactElement } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { ArtFrame, C, Ground, L, P, R } from './art/kit.js';

/**
 * A picture for every badge and every rung of the ladder (Will, 5 October,
 * D-295), in the same style as the place cards (`art/kit.tsx`): what the
 * badge is named for, drawn as one object on cut colour. A badge is a
 * medal, so on Points it is clipped round; on Profile's square tile it is
 * square, matching the tile beside it.
 *
 * Locked — not earned yet — draws it in grey at lower strength, so the
 * ladder still shows what is ahead without pretending it is yours.
 */
export interface BadgeArtProps {
  /** A `BADGES` key from `@pam/config` — "rooted", "scholar"… */
  readonly badgeKey: string;
  readonly size?: number;
  readonly shape?: 'square' | 'circle';
  readonly isLocked?: boolean;
}

// --- The ladder ------------------------------------------------------------

/** Returned: an open door, the light coming through. */
function Returned() {
  return (
    <>
      <Ground base="teal2" shards={[{ d: 'M0 44 56 34v22H0z', f: 'purple3' }]} />
      <R x={18} y={10} w={24} h={36} f="purple5" />
      <R x={20} y={12} w={20} h={34} f="yellow3" />
      <R x={30} y={12} w={10} h={34} f="yellow4" />
      <P d="M20 46h20l10 10H10z" f="yellow2" />
      <P d="M20 12 11 16v34l9-4z" f="orange3" />
      <P d="M15.5 14v34l4.5-2V12z" f="orange4" />
      <C cx={13.5} cy={31} r={1.4} f="yellow4" />
    </>
  );
}

/** Rooted: a seedling, its roots in the ground. */
function Rooted() {
  return (
    <>
      <Ground base="orange2" shards={[{ d: 'M0 0h26L0 22z', f: 'pink2' }]} />
      <P d="M4 40Q28 30 52 40V56H4z" f="purple4" />
      <P d="M28 34Q40 35 52 40V56H28z" f="purple5" />
      <L d="M28 40v9M28 44l-5 5M28 45l5 4" f="orange3" w={1.6} />
      <L d="M28 40V22" f="shamrock4" w={2.6} />
      <P d="M28 31C19 31 14 25 14 18c8 0 14 5 14 13z" f="shamrock3" />
      <P d="M28 26c7 0 13-6 13-13-8 0-13 5-13 13z" f="shamrock4" />
    </>
  );
}

/** Builder: a hammer. */
function Builder() {
  return (
    <>
      <Ground base="yellow2" shards={[{ d: 'M56 26v30H22z', f: 'orange3' }]} />
      <P d="M37.2 19.2 14.2 42.2l3.6 3.6 23-23z" f="orange3" />
      <P d="M39 21 16 44l1.8 1.8 23-23z" f="orange4" />
      <P d="M34.8 11.2 48.8 25.2l-5.6 5.6-14-14z" f="gray4" />
      <P d="M32 14 46 28l-2.8 2.8-14-14z" f="gray5" />
    </>
  );
}

/** Provider: a basket, full. */
function Provider() {
  return (
    <>
      <Ground base="pink2" shards={[{ d: 'M0 40 56 26v30H0z', f: 'purple3' }]} />
      <L d="M16 30c0-14 24-14 24 0" f="purple5" w={3} />
      <P d="M14 30c0-8 12-8 12 0z" f="yellow3" />
      <C cx={33} cy={26} r={5} f="red3" />
      <P d="M33 21a5 5 0 0 1 0 10z" f="red4" />
      <P d="M38 30l6-12-2 12z" f="shamrock3" />
      <P d="M10 30h36l-4 18H14z" f="orange3" />
      <P d="M28 30h18l-4 18H28z" f="orange4" />
      <L d="M13 36h30M15 42h26" f="orange5" w={1.5} />
    </>
  );
}

/** Pillar: a column. */
function Pillar() {
  return (
    <>
      <Ground base="teal2" shards={[{ d: 'M0 0h22L0 30z', f: 'teal3' }]} />
      <R x={12} y={8} w={32} h={4} f="orange3" />
      <R x={14} y={12} w={28} h={4} f="yellow3" />
      <R x={18} y={16} w={20} h={27} f="yellow2" />
      <R x={28} y={16} w={10} h={27} f="yellow3" />
      <L d="M22 18v23M25.5 18v23" f="yellow3" w={1.4} />
      <L d="M31.5 18v23M35 18v23" f="yellow4" w={1.4} />
      <R x={14} y={43} w={28} h={4} f="yellow3" />
      <R x={10} y={47} w={36} h={4} f="orange3" />
    </>
  );
}

/** Elder: a carved walking staff. */
function Elder() {
  return (
    <>
      <Ground base="purple2" shards={[{ d: 'M56 30v26H20z', f: 'pink3' }]} />
      <P d="M32.1 9.3 35.9 10.7 21.9 50.7 18.1 49.3z" f="orange4" />
      <P d="M34 10l1.9.7-14 40-1.9-.7z" f="orange5" />
      <L d="M26.6 25.4l3.8 1.4M25.4 29l3.8 1.4" f="yellow3" w={2.2} />
      <C cx={34.5} cy={10} r={5} f="orange3" />
      <P d="M34.5 5a5 5 0 0 1 0 10z" f="orange4" />
      <P d="M39 13l8-3-4 7z" f="shamrock3" />
    </>
  );
}

/** Chief: a crown. */
function Chief() {
  return (
    <>
      <Ground base="orange2" shards={[{ d: 'M0 46 56 36v20H0z', f: 'red3' }]} />
      <P d="M12 38 14 18l7 10 7-14 7 14 7-10 2 20z" f="yellow3" />
      <P d="M28 14l7 14 7-10 2 20H28z" f="yellow4" />
      <C cx={14} cy={18} r={2.2} f="yellow3" />
      <C cx={28} cy={14} r={2.2} f="yellow3" />
      <C cx={42} cy={18} r={2.2} f="yellow4" />
      <R x={12} y={38} w={32} h={6} f="orange4" />
      <C cx={20} cy={41} r={1.8} f="red3" />
      <C cx={28} cy={41} r={1.8} f="teal3" />
      <C cx={36} cy={41} r={1.8} f="red3" />
    </>
  );
}

// --- Category badges -------------------------------------------------------

/** Scholar: an open book. */
function Scholar() {
  return (
    <>
      <Ground base="blue2" shards={[{ d: 'M0 42 56 30v26H0z', f: 'purple3' }]} />
      <P d="M6 24v22q11-4 22 0 11-4 22 0V24l-2-2v22q-10-4-20 0-10-4-20 0V22z" f="purple5" />
      <P d="M8 22q10-4 20 0v22q-10-4-20 0z" f="yellow1" />
      <P d="M28 22q10-4 20 0v22q-10-4-20 0z" f="yellow2" />
      <L d="M12 27q6-2 12 0M12 32q6-2 12 0M12 37q6-2 12 0" f="gray3" w={1.2} />
      <L d="M32 27q6-2 12 0M32 32q6-2 12 0" f="gray4" w={1.2} />
      <P d="M38 21v11l2-2 2 2V21z" f="red3" />
    </>
  );
}

/** Griot: a scroll — the stories kept and told. */
function Griot() {
  return (
    <>
      <Ground base="orange2" shards={[{ d: 'M56 22v34H18z', f: 'purple3' }]} />
      <R x={14} y={14} w={28} h={28} f="yellow2" />
      <R x={28} y={14} w={14} h={28} f="yellow3" />
      <L d="M18 22h20M18 27h20M18 32h14" f="orange4" w={1.4} />
      <R x={10} y={10} w={36} h={6} rx={3} f="orange3" />
      <R x={28} y={10} w={18} h={6} rx={3} f="orange4" />
      <R x={10} y={40} w={36} h={6} rx={3} f="orange3" />
      <R x={28} y={40} w={18} h={6} rx={3} f="orange4" />
    </>
  );
}

/** Craftsman: a wrench and a bolt. */
function Craftsman() {
  return (
    <>
      <Ground base="teal2" shards={[{ d: 'M0 40 56 28v28H0z', f: 'shamrock3' }]} />
      <P d="M35.2 21.2 12.2 44.2l3.6 3.6 23-23z" f="gray3" />
      <P d="M37 23 14 46l1.8 1.8 23-23z" f="gray4" />
      <C cx={38} cy={18} r={9} f="gray3" />
      <P d="M38 9a9 9 0 0 1 0 18z" f="gray4" />
      <P d="M38 18l6-10 5 5z" f="teal2" />
      <P d="M14 12l5-3 5 3v6l-5 3-5-3z" f="yellow3" />
      <C cx={19} cy={15} r={2} f="yellow4" />
    </>
  );
}

/** Cornerstone: a wall, and the stone it starts from. */
function Cornerstone() {
  return (
    <>
      <Ground base="purple2" shards={[{ d: 'M0 0h24L0 24z', f: 'pink3' }]} />
      <R x={8} y={37} w={19} h={9} rx={1} f="red3" />
      <R x={29} y={37} w={19} h={9} rx={1} f="red4" />
      <R x={8} y={26} w={9} h={9} rx={1} f="red4" />
      <R x={19} y={26} w={18} h={9} rx={1} f="red3" />
      <R x={39} y={26} w={9} h={9} rx={1} f="red4" />
      <R x={16} y={12} w={24} h={12} rx={1} f="orange3" />
      <R x={28} y={12} w={12} h={12} rx={1} f="orange4" />
    </>
  );
}

/** Anchor: an anchor. */
function Anchor() {
  return (
    <>
      <Ground base="blue2" shards={[{ d: 'M56 28v28H22z', f: 'teal3' }]} />
      <C cx={28} cy={12} r={5} f="purple5" />
      <C cx={28} cy={12} r={2.2} f="blue2" />
      <R x={26} y={16} w={4} h={29} f="purple5" />
      <R x={28} y={16} w={2} h={29} f="purple4" />
      <R x={18} y={20} w={20} h={4} rx={2} f="purple5" />
      <L d="M12 34q2 12 16 12t16-12" f="purple5" w={4} />
      <P d="M8 37l4-8 4 6z" f="purple5" />
      <P d="M48 37l-4-8-4 6z" f="purple5" />
    </>
  );
}

/** Steward: a hearth, and its fire. */
function Steward() {
  return (
    <>
      <Ground base="orange2" shards={[{ d: 'M0 44 56 34v22H0z', f: 'red3' }]} />
      <P d="M10 48V22h36v26h-8V34q-10-10-20 0v14z" f="red4" />
      <P d="M28 22h18v26h-8V34q-5-5-10-5z" f="red5" />
      <R x={8} y={17} w={40} h={5} f="orange4" />
      <P d="M28 46c-8 0-7-8-3-13 0 4 3 4 3 1 0-4 3-6 3-10 5 6 6 12 4 17-1 3-4 5-7 5z" f="yellow3" />
      <P d="M28 46c-4 0-4-4-2-7 1 2 3 2 3 0 2 2 3 5 1 6.5z" f="orange3" />
      <R x={20} y={45} w={16} h={3} rx={1.5} f="orange5" />
    </>
  );
}

// --- Milestones ------------------------------------------------------------

/** Firstborn: a sunrise — the first one. */
function Firstborn() {
  return (
    <>
      <Ground base="pink2" />
      <L d="M28 18v-6M16 24l-4-4M40 24l4-4M10 32H5M46 32h5" f="yellow3" w={2.5} />
      <P d="M14 36a14 14 0 0 1 28 0z" f="yellow3" />
      <P d="M28 22a14 14 0 0 1 14 14H28z" f="orange3" />
      <P d="M0 36h56v20H0z" f="purple4" />
      <P d="M0 44l56-6v18H0z" f="purple5" />
    </>
  );
}

/** Torchbearer: a torch. */
function Torchbearer() {
  return (
    <>
      <Ground base="purple2" shards={[{ d: 'M56 30v26H24z', f: 'blue3' }]} />
      <P d="M24 30h8l-2 20h-4z" f="orange4" />
      <P d="M28 30h4l-2 20h-2z" f="orange5" />
      <P d="M20 26h16l-3 5H23z" f="yellow4" />
      <P d="M28 26c-9 0-8-9-4-14 0 5 3 5 3 1 0-4 3-6 3-9 7 7 8 15 5 19-1 2-4 3-7 3z" f="red3" />
      <P d="M28 26c-4 0-4-5-2-8 1 3 3 2 3 0 3 3 3 6 1 7.5z" f="yellow3" />
    </>
  );
}

/** Drum: a djembe. */
function Drum() {
  return (
    <>
      <Ground base="yellow2" shards={[{ d: 'M0 0h24L0 26z', f: 'orange3' }]} />
      <P d="M14 16q0 14 10 16h8q10-2 10-16a14 4 0 0 1-28 0z" f="red3" />
      <P d="M28 20q14 0 14-4 0 14-10 16h-4z" f="red4" />
      <P d="M14 16a14 4 0 0 0 28 0 14 4 0 0 0-28 0z" f="yellow1" />
      <L d="M16 19l4 10 4-9 4 10 4-10 4 9 4-10" f="purple5" w={1.4} />
      <P d="M24 32l-2 14h12l-2-14z" f="red4" />
      <R x={20} y={45} w={16} h={4} rx={2} f="orange5" />
    </>
  );
}

/** Rainmaker: a cloud, and the rain. */
function Rainmaker() {
  return (
    <>
      <Ground base="blue2" shards={[{ d: 'M0 44 56 34v22H0z', f: 'teal3' }]} />
      <C cx={20} cy={25} r={8} f="gray1" />
      <C cx={30} cy={20} r={10} f="gray1" />
      <C cx={39} cy={26} r={7} f="gray2" />
      <R x={13} y={25} w={32} h={8} rx={4} f="gray1" />
      <R x={28} y={27} w={17} h={6} rx={3} f="gray2" />
      <P d="M18 38l2-4 2 4a2 2 0 0 1-4 0z" f="blue4" />
      <P d="M27 42l2-4 2 4a2 2 0 0 1-4 0z" f="blue4" />
      <P d="M36 38l2-4 2 4a2 2 0 0 1-4 0z" f="blue4" />
    </>
  );
}

/** Homecoming: a house, and the path to its door. */
function Homecoming() {
  return (
    <>
      <Ground base="shamrock2" shards={[{ d: 'M0 0h26L0 22z', f: 'teal3' }]} />
      <R x={14} y={26} w={28} h={20} f="orange3" />
      <R x={28} y={26} w={14} h={20} f="orange4" />
      <P d="M10 28 28 12l18 16z" f="red3" />
      <P d="M28 12l18 16H28z" f="red4" />
      <R x={24} y={34} w={8} h={12} f="purple5" />
      <R x={34} y={30} w={5} h={5} f="yellow2" />
      <P d="M24 46h8l4 10H20z" f="yellow2" />
    </>
  );
}

/** Sankofa: the bird that looks back for its egg — go back and fetch it. */
function Sankofa() {
  return (
    <>
      <Ground base="orange2" shards={[{ d: 'M0 46 56 38v18H0z', f: 'purple3' }]} />
      <L d="M24 44v8M32 44v8" f="orange5" w={2} />
      <P d="M14 36l-8-6 4 10z" f="teal4" />
      <P d="M14 36c0-10 10-14 20-12 8 2 10 10 6 16-4 6-18 6-26-4z" f="teal3" />
      <P d="M34 24c8 2 10 10 6 16-3 4-8 5-12 5z" f="teal4" />
      <L d="M38 28c4-8 0-14-6-14" f="teal3" w={5} />
      <C cx={31} cy={15} r={5} f="teal3" />
      <P d="M27 15l-5 2 5 1z" f="yellow4" />
      <C cx={32} cy={14} r={1} f="purple5" />
      <C cx={23} cy={23} r={3.5} f="yellow2" />
    </>
  );
}

/** Kinkeeper: a family, kept together. */
function Kinkeeper() {
  return (
    <>
      <Ground base="pink2" shards={[{ d: 'M0 44 56 34v22H0z', f: 'purple3' }]} />
      <C cx={18} cy={20} r={5} f="orange4" />
      <P d="M10 46V36a8 8 0 0 1 16 0v10z" f="teal3" />
      <C cx={38} cy={20} r={5} f="orange3" />
      <P d="M30 46V36a8 8 0 0 1 16 0v10z" f="purple4" />
      <C cx={28} cy={31} r={4} f="orange4" />
      <P d="M22 52V43a6 6 0 0 1 12 0v9z" f="yellow3" />
    </>
  );
}

const ART: Readonly<Record<string, () => ReactElement>> = {
  returned: Returned,
  rooted: Rooted,
  builder: Builder,
  provider: Provider,
  pillar: Pillar,
  elder: Elder,
  chief: Chief,
  scholar: Scholar,
  griot: Griot,
  craftsman: Craftsman,
  cornerstone: Cornerstone,
  anchor: Anchor,
  steward: Steward,
  firstborn: Firstborn,
  torchbearer: Torchbearer,
  drum: Drum,
  rainmaker: Rainmaker,
  homecoming: Homecoming,
  sankofa: Sankofa,
  kinkeeper: Kinkeeper,
};

/** Every badge that has a picture — a test checks it matches `BADGES`. */
export const BADGE_ART_KEYS: readonly string[] = Object.keys(ART);

const styles = stylex.create({
  wrap: { flexShrink: 0, lineHeight: 0 },
  locked: { filter: 'grayscale(1)', opacity: 0.6 },
});

export function BadgeArt({ badgeKey, size = 56, shape = 'circle', isLocked = false }: BadgeArtProps) {
  const Art = ART[badgeKey] ?? Returned;
  return (
    <HStack aria-hidden xstyle={[styles.wrap, isLocked && styles.locked]}>
      <ArtFrame size={size} shape={shape}>
        <Art />
      </ArtFrame>
    </HStack>
  );
}

/** Profile's Connections tile (D-295): two people, and something said between them. */
export function ConnectionsArt({ size = 88 }: { readonly size?: number }) {
  return (
    <HStack aria-hidden xstyle={styles.wrap}>
      <ArtFrame size={size}>
        <Ground base="teal2" shards={[{ d: 'M0 40 56 26v30H0z', f: 'shamrock3' }, { d: 'M40 0h16v14z', f: 'orange3' }]} />
        <C cx={19} cy={28} r={6} f="orange4" />
        <P d="M9 52V44a10 10 0 0 1 20 0v8z" f="purple4" />
        <P d="M19 34a10 10 0 0 1 10 10v8H19z" f="purple5" />
        <C cx={38} cy={25} r={6} f="orange3" />
        <P d="M28 52V41a10 10 0 0 1 20 0v11z" f="yellow3" />
        <P d="M38 31a10 10 0 0 1 10 10v11H38z" f="yellow4" />
        <R x={20} y={6} w={16} h={10} rx={3} f="gray1" />
        <P d="M24 16l-2 4 6-4z" f="gray1" />
        <C cx={24.5} cy={11} r={1.2} f="purple4" />
        <C cx={28} cy={11} r={1.2} f="purple4" />
        <C cx={31.5} cy={11} r={1.2} f="purple4" />
      </ArtFrame>
    </HStack>
  );
}
