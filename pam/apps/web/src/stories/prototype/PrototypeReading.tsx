'use client';

import { useSearchParams } from 'next/navigation';
import { PRIVACY } from '@pam/config';
import { LegalPage } from '../../components/LegalPage';
import { PrivacyControlsView } from '../../screens/PrivacyViews';
import { decorFromParam } from '../../lib/readingStyle';

/**
 * The long, important screens in each of their two looks (D-416): `?decor=icons`
 * or `?decor=plain`. Storybook only — the app reads `READING_STYLE`.
 */
export function PrototypeWhatOthersCanSee() {
  return <PrivacyControlsView decor={decorFromParam(useSearchParams()?.get('decor'))} />;
}

export function PrototypePrivacyPolicy() {
  return <LegalPage doc={PRIVACY} decor={decorFromParam(useSearchParams()?.get('decor'))} />;
}
