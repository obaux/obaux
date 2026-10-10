'use client';

import { AllPlacesIcon, EducationIcon, FamilyServicesIcon, WorkforceIcon } from '@pam/ui';
import { CATEGORY_DEFINITIONS, type Category } from '@pam/config';
import { CategoryArt } from '@pam/ui/CategoryArt';

/*
 * Moved out of `SavedView` so a screen that only draws a place's picture does
 * not carry the whole Saved screen with it: Explore, the app's front door, is
 * measured against §12's first-load budget and was paying for Saved's code to
 * draw this. `SavedView` still exports both, for everything that imports them there.
 */
const ART = { width: 52, height: 52, 'aria-hidden': true } as const;

/**
 * A category's illustration, edge to edge in the box it sits in (Will,
 * 7 October, D-337: "just use the illustrations by category"): Saved's
 * tiles, every trip card, Explore's next visit and Check. The pale ground
 * with shards and grain behind an icon (D-297) is gone; only the chips keep
 * their shaded dot.
 */
export function CategoryPicture({ category, seed }: { readonly category: string; readonly seed?: string }) {
  return <CategoryArt category={(category in CATEGORY_DEFINITIONS ? category : 'education') as Category} size="fill" {...(seed ? { seed } : {})} />;
}

/** The chips' icon for a category, drawn large for the placeholder picture. */
export function BigCategoryIcon({
  category,
  size = ART,
}: {
  readonly category: string;
  readonly size?: { readonly width: number; readonly height: number; readonly 'aria-hidden': true };
}) {
  switch (category) {
    case 'education':
      return <EducationIcon {...size} />;
    case 'workforce':
      return <WorkforceIcon {...size} />;
    case 'family_services':
      return <FamilyServicesIcon {...size} />;
    default:
      return <AllPlacesIcon {...size} />;
  }
}
