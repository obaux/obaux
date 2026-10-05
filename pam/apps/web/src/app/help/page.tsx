'use client';

import { HelpView } from '../../screens/HelpViews';

/**
 * Get help (§0, §2.4), as a list of the kinds of help since D-213: call PAM
 * (the first row, a `tel:` link with the hours), what we help with, a safety
 * issue, a place that is wrong. Each opens a page on the nested-page
 * template; all of it is static, so it works with no JavaScript, no session
 * and no database, as this screen always has.
 */
export default function HelpPage() {
  return <HelpView />;
}
