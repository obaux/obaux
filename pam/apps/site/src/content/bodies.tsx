import type { JSX } from 'react';
import { CaseManagerAssignments } from './CaseManagerAssignments';
import { KeepingYourListing } from './KeepingYourListing';
import { JoiningAsStaff } from './JoiningAsStaff';
import { JoiningPam } from './JoiningPam';
import { MessagesInPam } from './MessagesInPam';
import { OnePhoneTwoSides } from './OnePhoneTwoSides';
import { PamWords } from './PamWords';
import { PlanningAVisit } from './PlanningAVisit';
import { PointsAndBadges } from './PointsAndBadges';
import { SendingAnInvite } from './SendingAnInvite';
import { StaffRequests } from './StaffRequests';
import { TextsFromPam } from './TextsFromPam';
import { WhatOthersCanSee } from './WhatOthersCanSee';
import { WhoIsMyGuide } from './WhoIsMyGuide';


/**
 * The body of each support post, by slug. A new post is an entry in
 * `posts.ts` and one here (see `.claude/skills/pam-support-post`); the site's
 * route, the Support index, search, and the Storybook journey all read these two
 * lists, so nothing else needs touching.
 */
export const BODIES: Record<string, () => JSX.Element> = {
  'case-manager-assignments': CaseManagerAssignments,
  'keeping-your-listing-up-to-date': KeepingYourListing,
  'who-is-my-guide': WhoIsMyGuide,
  'texts-from-pam': TextsFromPam,
  'planning-a-visit': PlanningAVisit,
  'what-others-can-see': WhatOthersCanSee,
  'joining-pam': JoiningPam,
  'joining-as-staff': JoiningAsStaff,
  'pam-words': PamWords,
  'one-phone-two-sides': OnePhoneTwoSides,
  'sending-an-invite': SendingAnInvite,
  'messages-in-pam': MessagesInPam,
  'points-and-badges': PointsAndBadges,
  'staff-requests': StaffRequests,
};
