'use client';

import dynamic from 'next/dynamic';

/** The picker sheet, loaded the first time "New message" is tapped (D-186). */
export const NewMessagePickerLazy = dynamic(
  () => import('./NewMessagePicker').then((mod) => mod.NewMessagePicker),
  { ssr: false },
);
