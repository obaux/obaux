'use client';

import { ArtFrame, C, Ground, L, P, R } from './art/kit.js';

/**
 * Two friends going together (D-336, Will, 7 October: "create an image
 * illustration for bringing a friend that takes up the hero section of the
 * drawer … for a more festive feel"). Drawn with the shared kit, in the
 * sign-in carousel's flat, hard-edged style with its grain: a warm ground,
 * two people side by side (one waving), and confetti in the air.
 */
export interface FriendsArtProps {
  /** Square, in px. */
  readonly size?: number;
}

export function FriendsArt({ size = 168 }: FriendsArtProps) {
  return (
    <ArtFrame size={size}>
      <Ground
        base="yellow2"
        shards={[
          { d: 'M0 42 56 34v22H0z', f: 'orange3' },
          { d: 'M38 0h18v14z', f: 'pink3' },
          { d: 'M0 0h12L0 10z', f: 'teal3' },
        ]}
      />
      {/* The friend on the left: teal top, waving. */}
      <P d="M9 56V42a8 8 0 0 1 8-8h4a8 8 0 0 1 8 8v14z" f="teal4" />
      <P d="M19 56V34h2a8 8 0 0 1 8 8v14z" f="teal5" />
      <C cx={19} cy={26} r={6} f="orange4" />
      <P d="M13 24a6 6 0 0 1 12 0c-3-2-9-2-12 0z" f="purple5" />
      <L d="M11 40 6 30" f="teal4" w={4} />
      <C cx={5.5} cy={28.5} r={2.4} f="orange4" />
      {/* The friend on the right: purple top, an arm across to the first. */}
      <P d="M29 56V43a8 8 0 0 1 8-8h3a8 8 0 0 1 8 8v13z" f="purple4" />
      <P d="M38 56V35h2a8 8 0 0 1 8 8v13z" f="purple5" />
      <C cx={38} cy={27} r={6} f="orange3" />
      <P d="M32 25.5a6 6 0 0 1 12-1.5c-3 1-7 .5-12 1.5z" f="red5" />
      <L d="M31 42 25 44" f="purple4" w={4} />
      {/* Confetti. */}
      <R x={27} y={7} w={3} h={3} f="red3" />
      <R x={46} y={18} w={2.5} h={2.5} f="shamrock3" />
      <R x={9} y={13} w={2.5} h={2.5} f="blue3" />
      <R x={33} y={15} w={2} h={2} f="purple3" />
      <C cx={18} cy={9} r={1.4} f="shamrock3" />
      <C cx={50} cy={8} r={1.4} f="yellow4" />
      <C cx={44} cy={12} r={1.1} f="blue3" />
      <L d="M23 14l2-3" f="pink4" w={1.4} />
      <L d="M40 6l3 1" f="teal4" w={1.4} />
    </ArtFrame>
  );
}
