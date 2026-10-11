'use client';

import { forwardRef, type ComponentProps } from 'react';
import { Heading } from '@astryxdesign/core/Heading';

/**
 * A heading whose text is data, not Pam's words: a place's or program's name, a
 * person's name (D-534). It reads in the direction of its own text (`dir="auto"`),
 * so a Latin name on an Arabic page keeps its punctuation on the right side and is
 * cut at its end, not its start, and an Arabic name on an English page reads from
 * the right. Pam's own headings ("Your trips") do not use this: they keep the
 * page's direction.
 *
 * It is the `Heading` it wraps, prop for prop. For a page title that is a name, use
 * `SubPageHeader`'s `isTitleData` instead.
 */
export const DataHeading = forwardRef<HTMLHeadingElement, ComponentProps<typeof Heading>>(function DataHeading(
  props,
  ref,
) {
  return <Heading ref={ref} dir="auto" {...props} />;
});
