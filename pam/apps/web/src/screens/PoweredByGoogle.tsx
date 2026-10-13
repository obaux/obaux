'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';

/**
 * Google's attribution for the street suggestions (D-552). Google requires its logo whenever its predictions are shown without a Google
 * map. This holds the place for it, inline under the results, as Google's rules ask. It shows the name as text until the design lane
 * (Dot) adds Google's own mark from their branding page: the asset is Google's, not drawn here.
 */
const styles = stylex.create({
  row: { width: '100%' },
  mark: { fontSize: '14px', lineHeight: 1.4, fontWeight: 600 },
});

export function PoweredByGoogle() {
  return (
    <HStack justify="end" xstyle={styles.row} data-google-attribution="">
      <Text type="supporting" xstyle={styles.mark} dir="ltr">
        powered by Google
      </Text>
    </HStack>
  );
}
