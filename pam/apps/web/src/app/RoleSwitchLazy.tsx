'use client';

import dynamic from 'next/dynamic';

/**
 * The view switcher, fetched by the one person who has it.
 *
 * It is the only thing on the home screen that needs Astryx's DropdownMenu, and
 * it renders for exactly one role — a super admin checking what each kind of
 * person sees (D-108). Every member and every case manager was downloading a
 * menu component they can never open, on the first load §12 measures.
 *
 * Same reasoning as `SavedStripLazy`, and the same shape. `ssr: false` because
 * it depends on a role the browser has to fetch before it knows.
 */
export const RoleSwitchLazy = dynamic(
  () => import('@pam/ui/RoleSwitch').then((mod) => mod.RoleSwitch),
  { ssr: false },
);
