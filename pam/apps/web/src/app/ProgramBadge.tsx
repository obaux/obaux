'use client';

import { Token } from '@astryxdesign/core/Token';

/**
 * Which program a person is connected to — a clickable badge, not a plain
 * label, because the program it names is a real place with its own screen
 * (`/place/?id=…`) and naming it without a way to it is half the point of
 * having a place screen at all.
 *
 * Built on Astryx's own `Token` with `href` set, the library's existing
 * pattern for a clickable chip — not a hand-rolled `Badge` wrapped in a
 * link. `Token` already handles the accessibility of "a chip that is also a
 * link" (a real `<a>`, a visible focus ring, an accessible name), which a
 * `Badge` + `<a>` pairing would have had to re-solve from nothing.
 *
 * Never paired with a row that already has its own stretched-link `href`
 * (see `PersonRow`): nesting one link's tap target inside another's is
 * exactly what `PersonRow`'s own `trailing` doc comment already warns
 * against for the same reason.
 */
export function ProgramBadge({ name, serviceId }: { readonly name: string; readonly serviceId: string }) {
  return <Token label={name} href={`/place/?id=${encodeURIComponent(serviceId)}`} size="sm" />;
}
