'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';

/**
 * Google's attribution for the street suggestions (D-552, D-557). Google requires its logo whenever its predictions are shown
 * without a Google map (Policies and attributions for Places API). Rules, from that page as Mira read it on 13 October:
 *
 * - The "Google Maps" logo, unaltered: **16dp at least, 19dp at most** in height; clear space of **10 left, right and top, 5 bottom**.
 * - Its accessible name is "Google Maps", not "Powered by Google". A brand name, never translated (the wordmark's alt "Pam" is the same).
 * - A plain version for flat backgrounds (this is one: the drawer's surface) and an outlined one for busy pictures.
 * - Centred in the row, with the sheet's footer line centred under it (Will, 13 October).
 * - Only where the logo cannot fit, the words "Google Maps" instead: same capitalisation, no wrapping, `translate="no"`.
 *
 * The files are Google's own, kept as downloaded (`apps/web/public/google/README.md` says where from), served by Pam and never loaded from
 * Google (Privacy p5). One for light backgrounds and one for dark, chosen by the browser's colour scheme like the Pam wordmark.
 * If the file fails to load the words stand in, so the attribution is never missing.
 */
const LOGO_HEIGHT = 18; // Google: 16 to 19. In the middle, so a rounding or a zoom never takes it out of range.

const styles = stylex.create({
  row: { width: '100%', boxSizing: 'border-box' },
  // Google's clear space: 10 left, right and top; 5 below.
  space: { paddingInline: '10px', paddingBlockStart: '10px', paddingBlockEnd: '5px' },
  logo: { display: 'block', height: `${LOGO_HEIGHT}px`, width: 'auto' },
  words: { fontSize: '14px', lineHeight: 1.4, fontWeight: 600, whiteSpace: 'nowrap' },
});

export function PoweredByGoogle() {
  const [failed, setFailed] = useState(false);
  return (
    <HStack justify="center" xstyle={[styles.row, styles.space]} data-google-attribution="">
      {failed ? (
        <span translate="no" lang="en" dir="ltr">
          <Text type="supporting" xstyle={styles.words}>
            Google Maps
          </Text>
        </span>
      ) : (
        <picture>
          <source srcSet="/google/google-maps-attribution-dark.svg" media="(prefers-color-scheme: dark)" />
          <img
            src="/google/google-maps-attribution-light.svg"
            alt="Google Maps"
            height={LOGO_HEIGHT}
            translate="no"
            onError={() => setFailed(true)}
            {...stylex.props(styles.logo)}
          />
        </picture>
      )}
    </HStack>
  );
}
