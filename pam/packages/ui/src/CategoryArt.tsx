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

/** Family and food: a grocery bag with greens and an apple. */
function FamilyServices() {
  return (
    <>
      <Ground base="purple2" shards={[{ d: 'M0 42 56 26v30H0z', f: 'purple4' }, { d: 'M40 0h16v11z', f: 'pink3' }]} />
      <P d="M21 25 15 9l10 9z" f="shamrock3" />
      <P d="M25 25 28 6l4 15z" f="shamrock4" />
      <P d="M30 25l8-13-1 13z" f="shamrock3" />
      <C cx={37} cy={23} r={6.5} f="red3" />
      <P d="M37 16.5a6.5 6.5 0 0 1 0 13z" f="red4" />
      <P d="M13 25h30l3 23H10z" f="yellow3" />
      <P d="M28 25h15l3 23H28z" f="yellow4" />
      <P d="M13 25h30l-.5 4h-29z" f="orange3" />
    </>
  );
}

const ART: Readonly<Record<Category, () => ReactElement>> = {
  education: Education,
  workforce: Workforce,
  family_services: FamilyServices,
};

export function CategoryArt({ category, size = 56 }: CategoryArtProps) {
  const Art = ART[category] ?? Education;
  return (
    <ArtFrame size={size}>
      <Art />
    </ArtFrame>
  );
}
