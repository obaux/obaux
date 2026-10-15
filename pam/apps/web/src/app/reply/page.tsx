'use client';

import { Suspense } from 'react';
import { Loading, Page } from '@pam/ui';
import { SupportReplyScreen } from '../../screens/SupportReplyScreen';

/**
 * Answer a help request by text (A28, D-524): the page the "Reply by text" link in the request email opens, with the
 * number in the link (`?to=`). Super admin only; nothing is kept about the person but a hashed log row.
 * `useSearchParams` needs a Suspense boundary in an exported app, as on `/flag/`.
 */
export default function ReplyPage() {
  return (
    <Suspense
      fallback={
        <Page gap={3}>
          <Loading label="" variant="screen" />
        </Page>
      }
    >
      <SupportReplyScreen />
    </Suspense>
  );
}
