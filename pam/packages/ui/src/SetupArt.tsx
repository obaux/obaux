'use client';

import type { ReactElement } from 'react';
import { ArtFrame, C, Ground, L, P, R } from './art/kit.js';

/**
 * The pictures on a program lead's getting-started cards (D-352), drawn with
 * the same kit as the place cards (`art/kit.tsx`) so Home reads as one set
 * with Explore and Saved: one object each, flat colour, lit from the left.
 *
 *   program  — a shopfront with its awning out: your place, on Pam
 *   photo    — an instant photo of a smiling face: you, to the people coming
 *   calendar — a calendar page with a day ticked: who is coming in
 *
 * And, for What to expect at sign-up (D-354):
 *
 *   message  — two speech bubbles: people write to you
 *   policy   — a page with a signature: your policies, signed
 *   private  — a shield with a keyhole: what Pam keeps to itself
 *
 * And Profile's text-alerts card (D-360):
 *
 *   alerts   — a bell ringing, a red dot: Pam will text you
 *
 * And one account, two sides (D-376), for the hero of "Add your program":
 *
 *   switch   — two of you, a member and the program, with arrows between
 */
export const SETUP_ART_KINDS = ['program', 'photo', 'calendar', 'message', 'policy', 'private', 'alerts', 'switch'] as const;
export type SetupArtKind = (typeof SETUP_ART_KINDS)[number];

export interface SetupArtProps {
  readonly kind: SetupArtKind;
  /** Square, in px — 56 like a place card — or `"fill"` (D-337). */
  readonly size?: number | 'fill';
  /**
   * In a large banner — the hero template (D-376): fills it, the subject
   * drawn smaller at the centre, the grain quieter. A rule for every
   * illustration used this big.
   */
  readonly isHero?: boolean;
}

/** Add your program: a shopfront, awning out. */
function Program() {
  return (
    <>
      <Ground base="teal2" shards={[{ d: 'M0 44 56 32v24H0z', f: 'teal3' }]} />
      <R x={10} y={22} w={36} h={26} f="yellow3" />
      <R x={28} y={22} w={18} h={26} f="yellow4" />
      <R x={14} y={30} w={12} h={10} f="teal4" />
      <R x={31} y={30} w={10} h={18} rx={1} f="purple5" />
      <C cx={38.5} cy={39} r={1.2} f="yellow3" />
      <P d="M8 14h40l3 9H5z" f="red3" />
      <P d="M28 14h20l3 9H28z" f="red4" />
      <P d="M14 14h7l-1 9h-7zM35 14h7l2 9h-7z" f="pink2" />
      <P d="M5 23h9a4.5 4.5 0 0 1-9 0zM14 23h9.3a4.6 4.6 0 0 1-9.3 0zM23.3 23h9.4a4.7 4.7 0 0 1-9.4 0zM32.7 23H42a4.6 4.6 0 0 1-9.3 0zM42 23h9a4.5 4.5 0 0 1-9 0z" f="red3" />
      <R x={6} y={48} w={44} h={3} f="purple4" />
    </>
  );
}

/** Add your photo: an instant photo, a face smiling out of it. */
function Photo() {
  return (
    <>
      <Ground base="orange2" shards={[{ d: 'M0 0h24L0 20z', f: 'pink2' }, { d: 'M56 34v22H30z', f: 'orange3' }]} />
      <P d="M12 12 42 8l4 36-30 4z" f="gray1" />
      <P d="M27 10l15-2 4 36-15 2z" f="gray2" />
      <P d="M15.5 15.5 39.5 12.4l2.4 21.4-24 3z" f="blue3" />
      <P d="M28 14l11.5-1.6 2.4 21.4-12 1.5z" f="blue4" />
      <C cx={28.5} cy={21.5} r={4.6} f="orange3" />
      <P d="M28.4 16.9a4.6 4.6 0 0 1 .2 9.2z" f="orange4" />
      <P d="M19.7 35.6c.8-5.4 4.4-8.3 9.1-8.8 4.7-.5 8.8 1.8 10.7 6.8z" f="shamrock3" />
      <P d="M29 26.8c4.6-.4 8.6 1.9 10.5 6.8L30 34.8z" f="shamrock4" />
      <L d="M26.6 22.9c.9.9 2.5.7 3.2-.3" f="purple5" w={1.1} />
    </>
  );
}

/** See your calendar: a page with one day ticked. */
function Calendar() {
  return (
    <>
      <Ground base="purple2" shards={[{ d: 'M0 40 56 28v28H0z', f: 'purple3' }, { d: 'M42 0h14v12z', f: 'yellow3' }]} />
      <R x={10} y={14} w={36} h={34} rx={4} f="gray1" />
      <P d="M28 14h14a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H28z" f="gray2" />
      <P d="M14 14h28a4 4 0 0 1 4 4v6H10v-6a4 4 0 0 1 4-4z" f="red3" />
      <P d="M28 14h14a4 4 0 0 1 4 4v6H28z" f="red4" />
      <R x={17} y={10} w={3} h={8} rx={1.5} f="purple5" />
      <R x={36} y={10} w={3} h={8} rx={1.5} f="purple5" />
      <R x={15} y={28} w={6} h={5} rx={1} f="purple3" />
      <R x={25} y={28} w={6} h={5} rx={1} f="purple3" />
      <R x={15} y={37} w={6} h={5} rx={1} f="purple3" />
      <R x={35} y={37} w={6} h={5} rx={1} f="purple3" />
      <C cx={38} cy={30.5} r={5.5} f="shamrock3" />
      <P d="M38 25a5.5 5.5 0 0 1 0 11z" f="shamrock4" />
      <L d="m35.6 30.6 1.7 1.7 3.2-3.4" f="gray1" w={1.6} />
      <R x={25} y={37} w={6} h={5} rx={1} f="orange3" />
    </>
  );
}

/** People write to you: two bubbles. */
function Message() {
  return (
    <>
      <Ground base="blue2" shards={[{ d: 'M0 42 56 30v26H0z', f: 'blue3' }]} />
      <P d="M8 12h28a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H20l-7 6v-6H8a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" f="yellow3" />
      <P d="M22 12h14a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H22z" f="yellow4" />
      <C cx={14} cy={23} r={2} f="purple5" />
      <C cx={22} cy={23} r={2} f="purple5" />
      <C cx={30} cy={23} r={2} f="purple5" />
      <P d="M30 30h18a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-2v5l-6-5H30a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z" f="shamrock3" />
      <P d="M40 30h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-2v5l-6-5z" f="shamrock4" />
    </>
  );
}

/** Your policies, signed: a page with a signature on its line. */
function Policy() {
  return (
    <>
      <Ground base="yellow2" shards={[{ d: 'M0 0h22L0 18z', f: 'orange2' }, { d: 'M56 36v20H28z', f: 'orange3' }]} />
      <R x={13} y={8} w={30} h={40} rx={3} f="gray1" />
      <P d="M28 8h12a3 3 0 0 1 3 3v34a3 3 0 0 1-3 3H28z" f="gray2" />
      <R x={18} y={15} w={20} h={2.5} rx={1.2} f="purple3" />
      <R x={18} y={21} w={16} h={2.5} rx={1.2} f="purple3" />
      <R x={18} y={27} w={18} h={2.5} rx={1.2} f="purple3" />
      <L d="M18 39c2-4 4-4 5-1s3 3 5-1 4-3 5 0" f="blue4" w={1.8} />
      <R x={17} y={42} w={22} h={1.5} f="gray4" />
      <C cx={42} cy={42} r={7} f="shamrock3" />
      <P d="M42 35a7 7 0 0 1 0 14z" f="shamrock4" />
      <L d="m39 42 2 2 4-4" f="gray1" w={1.8} />
    </>
  );
}

/** What Pam keeps to itself: a shield with a keyhole. */
function Private() {
  return (
    <>
      <Ground base="pink2" shards={[{ d: 'M0 40 56 26v30H0z', f: 'purple3' }]} />
      <P d="M28 8 44 14v12c0 11-7 18-16 22-9-4-16-11-16-22V14z" f="teal3" />
      <P d="M28 8 44 14v12c0 11-7 18-16 22z" f="teal4" />
      <C cx={28} cy={25} r={4} f="purple5" />
      <P d="M26.2 27h3.6l1.2 8h-6z" f="purple5" />
    </>
  );
}

/** Text alerts: a bell, ringing, with a dot for something new. */
function Alerts() {
  return (
    <>
      <Ground base="teal2" shards={[{ d: 'M0 40 56 28v28H0z', f: 'teal3' }, { d: 'M40 0h16v12z', f: 'purple3' }]} />
      <L d="M12 20c-2 3-2.6 6-2 9M44 20c2 3 2.6 6 2 9" f="purple4" w={2.4} />
      <C cx={28} cy={12.5} r={2.5} f="orange4" />
      <P d="M28 13c-7 0-12 5.4-12 12.5V34l-4 5h32l-4-5v-8.5C40 18.4 35 13 28 13z" f="yellow3" />
      <P d="M28 13c7 0 12 5.4 12 12.5V34l4 5H28z" f="yellow4" />
      <R x={12} y={38} w={32} h={3} rx={1.5} f="orange3" />
      <P d="M23.5 41h9a4.5 4.5 0 0 1-9 0z" f="orange4" />
      <C cx={38} cy={14} r={4.5} f="red3" />
      <P d="M38 9.5a4.5 4.5 0 0 1 0 9z" f="red4" />
    </>
  );
}

/**
 * One account, two sides: you as a member (left) and you at your program
 * (right, a little shopfront badge), with two chunky arrows turning between
 * them — the same person, either way round. The arrows are drawn as shapes,
 * lit from the left like everything else in the set, not as strokes (Will,
 * D-376: "arrows also feel cubic"), each head turned to carry on the arc's
 * own line. `zoom` draws the figures smaller on the
 * full ground, for a banner.
 */
function Switch({ zoom = 1 }: { readonly zoom?: number }) {
  return (
    <>
      <Ground base="teal2" shards={[{ d: 'M0 40 56 30v26H0z', f: 'teal3' }, { d: 'M30 0h26v24z', f: 'yellow3' }]} />
      <g transform={`translate(28 28) scale(${zoom}) translate(-28 -28)`}>
        {/* You, as a member */}
        <P d="M8 39c0-6.5 3.6-10 8-10s8 3.5 8 10z" f="purple3" />
        <P d="M16 29c4.4 0 8 3.5 8 10h-8z" f="purple4" />
        <C cx={16} cy={22.5} r={4.5} f="orange3" />
        <P d="M16 18a4.5 4.5 0 0 1 0 9z" f="orange4" />
        {/* You, at your program */}
        <P d="M32 39c0-6.5 3.6-10 8-10s8 3.5 8 10z" f="shamrock3" />
        <P d="M40 29c4.4 0 8 3.5 8 10h-8z" f="shamrock4" />
        <C cx={40} cy={22.5} r={4.5} f="orange3" />
        <P d="M40 18a4.5 4.5 0 0 1 0 9z" f="orange4" />
        <R x={37.5} y={33} w={5} h={4} rx={1} f="yellow3" />
        <P d="M37 33h6l-.9-1.8h-4.2z" f="red3" />
        {/* The turn between them: a thick band and a solid head, each way */}
        <g transform="translate(0 -1.5)">
        <P d="M19.5 15.5c3.6-5 13.2-5.6 17-1.8l-2.4 2.2c-3-2.8-9.6-2.4-12.2 1.4z" f="red3" />
        <P d="M28 11.4c3.4-.3 6.5.6 8.5 2.3l-2.4 2.2c-1.5-1.3-3.7-2-6.1-2z" f="red4" />
        <P d="M37.4 12.7 33.2 16.9 37.8 17.3z" f="red4" />
        </g>
        <g transform="translate(0 2.5)">
        <P d="M36.5 40.5c-3.6 5-13.2 5.6-17 1.8l2.4-2.2c3 2.8 9.6 2.4 12.2-1.4z" f="red3" />
        <P d="M28 44.6c-3.4.3-6.5-.6-8.5-2.3l2.4-2.2c1.5 1.3 3.7 2 6.1 2z" f="red4" />
        <P d="M18.6 43.3 22.8 39.1 18.2 38.7z" f="red4" />
        </g>
      </g>
    </>
  );
}

const ART: Readonly<Record<SetupArtKind, (props: { readonly zoom?: number }) => ReactElement>> = {
  program: Program,
  photo: Photo,
  calendar: Calendar,
  message: Message,
  policy: Policy,
  private: Private,
  alerts: Alerts,
  switch: Switch,
};

export function SetupArt({ kind, size = 56, isHero = false }: SetupArtProps) {
  const Art = ART[kind];
  return (
    <ArtFrame size={isHero ? 'fill' : size} isSoftGrain={isHero}>
      <Art zoom={isHero ? 0.62 : 1} />
    </ArtFrame>
  );
}
