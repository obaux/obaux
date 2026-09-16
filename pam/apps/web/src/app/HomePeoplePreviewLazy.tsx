'use client';

import dynamic from 'next/dynamic';

/**
 * The Home people preview, fetched only for a super admin actively
 * previewing a role. Same reasoning as `RoleSwitchLazy` and `SavedStripLazy`:
 * it renders for one condition that is false for almost everybody, and the
 * example-people data it pulls in (`@pam/config/dummy-people`) is exactly
 * the module `HeaderBell`'s own file comment warns against loading
 * statically on Home.
 */
export const HomePeoplePreviewLazy = dynamic(
  () => import('./HomePeoplePreview').then((mod) => mod.HomePeoplePreview),
  { ssr: false },
);
