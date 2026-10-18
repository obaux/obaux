'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Badge } from './Badge';

/**
 * The one badge for "not yet" and "not real" (D-608).
 *
 * "Coming soon" on a feature that is not on yet, and "Example" on made-up people and alerts, are one
 * word each in the same grey pill: Astryx's neutral `Badge`, in its own size, set beside what it
 * qualifies and never in a sentence. A screen does not explain what Pam does not do yet, or why a list is
 * made up; the badge says it and the Privacy and Terms pages carry the rest. Use this wherever such a
 * word is drawn, so Text alerts, Profile and the example lists cannot drift into three looks.
 */
export function StatusBadge({ label }: { readonly label: string }) {
  // In its own row, so a column that stretches its children (a list's, a card's) does not stretch the pill.
  return (
    <HStack>
      <Badge variant="neutral" label={label} />
    </HStack>
  );
}
