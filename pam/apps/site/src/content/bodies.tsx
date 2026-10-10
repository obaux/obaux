import type { JSX } from 'react';
import { CaseManagerAssignments } from './CaseManagerAssignments';
import { KeepingYourListing } from './KeepingYourListing';

/**
 * The body of each support post, by slug. A new post is an entry in
 * `posts.ts` and one here (see `.claude/skills/pam-support-post`); the site's
 * route, the Support index, search, and the Storybook journey all read these two
 * lists, so nothing else needs touching.
 */
export const BODIES: Record<string, () => JSX.Element> = {
  'case-manager-assignments': CaseManagerAssignments,
  'keeping-your-listing-up-to-date': KeepingYourListing,
};
