'use client';

import type { ReactElement } from 'react';
import type { Category } from '@pam/config';
import { ArtFrame, C, Ground, L, P, R } from './art/kit.js';

/**
 * A small illustration for each kind of place (Will, 5 October, D-287), in
 * the sign-in carousel's style — see `art/kit.tsx` for the language. Drawn
 * with the shared kit, so the badges (D-295) are the same set.
 */
export interface CategoryArtProps {
  readonly category: Category;
  /** Square, in px. 56 on a place card. */
  readonly size?: number;
  /** The place's id: chooses among a category's pictures, the same every time (D-301). */
  readonly seed?: string;
  /** Or one picture by number — the stories show each. */
  readonly variant?: number;
}

/** School and training: a mortarboard on a stack of books. */
function Education() {
  return (
    <>
      <Ground base="pink2" shards={[{ d: 'M0 38 56 20v36H0z', f: 'purple3' }, { d: 'M36 0h20v15z', f: 'orange3' }]} />
      <P d="M9 40h38v9H9z" f="orange3" />
      <P d="M34 40h13v9H34z" f="orange4" />
      <P d="M12 31h32v9H12z" f="shamrock3" />
      <P d="M34 31h10v9H34z" f="shamrock4" />
      <P d="M18 21h20v7l-10 4-10-4z" f="purple5" />
      <P d="M28 10 47 18 28 26 9 18z" f="purple4" />
      <P d="M28 10 47 18 28 26z" f="purple5" />
      <L d="M28 18h14v9" f="yellow3" w={1.6} />
      <R x={40.5} y={26} w={3} h={4} f="yellow3" />
    </>
  );
}

/** Work and money: a briefcase. */
function Workforce() {
  return (
    <>
      <Ground base="shamrock2" shards={[{ d: 'M0 0h30L0 26z', f: 'teal3' }, { d: 'M56 30v26H24z', f: 'shamrock4' }]} />
      <L d="M22.5 21v-6a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v6" f="purple5" w={3} />
      <R x={8} y={20} w={40} h={27} rx={4} f="orange3" />
      <P d="M28 20h16a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H28z" f="orange4" />
      <P d="M8 30h40v3H8z" f="red4" />
      <R x={24.5} y={27.5} w={7} h={8} rx={1.5} f="yellow3" />
    </>
  );
}

/*
 * Home and family (Will, 5 October, D-301): the grocery bag was "not a fit"
 * for the category, but its colours were loved — so its picture keeps that
 * palette (purple ground, pink corner, yellow, red, greens).
 */

/** Home and family: a home, with a heart on the door. */
function FamilyHome() {
  return (
    <>
      <Ground base="purple2" shards={[{ d: 'M0 42 56 26v30H0z', f: 'purple4' }, { d: 'M40 0h16v11z', f: 'pink3' }]} />
      <C cx={11} cy={41} r={6} f="shamrock3" />
      <C cx={15} cy={39} r={5} f="shamrock4" />
      <R x={36} y={13} w={4} h={9} f="red4" />
      <R x={17} y={26} w={24} h={20} f="yellow3" />
      <R x={29} y={26} w={12} h={20} f="yellow4" />
      <P d="M13 28 29 12l16 16z" f="red3" />
      <P d="M29 12l16 16H29z" f="red4" />
      <R x={23} y={33} w={8} h={13} rx={1} f="purple5" />
      <P d="M27 40c-1.6-1.2-2.6-2-2.6-3a1.3 1.3 0 0 1 2.6-.5 1.3 1.3 0 0 1 2.6.5c0 1-1 1.8-2.6 3z" f="pink3" />
      <R x={34} y={31} w={5} h={5} f="orange3" />
      <P d="M23 46h8l4 10H19z" f="yellow2" />
    </>
  );
}

const ART: Readonly<Record<Category, readonly (() => ReactElement)[]>> = {
  education: [Education],
  workforce: [Workforce],
  // The home with a heart on its door (Will, D-302: "let's go with home
  // with heart on door"); the family picture was tried and set aside.
  family_services: [FamilyHome],
};

/** A stable small number from a place's id — the same id, the same picture. */
function pick(seed: string, count: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % count;
}

export function CategoryArt({ category, size = 56, seed, variant }: CategoryArtProps) {
  const all = ART[category] ?? [Education];
  const Art = all[(variant ?? (seed ? pick(seed, all.length) : 0)) % all.length] ?? Education;
  return (
    <ArtFrame size={size}>
      <Art />
    </ArtFrame>
  );
}
