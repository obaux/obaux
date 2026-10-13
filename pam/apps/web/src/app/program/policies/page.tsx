'use client';

import { NeedsOwnProgram } from '../../../screens/NeedsOwnProgram';
import { PoliciesScreen } from '../../../screens/PoliciesView';

/** A program's policies for participants (D-261). */
export default function PoliciesPage() {
  return (
    <NeedsOwnProgram>
      <PoliciesScreen />
    </NeedsOwnProgram>
  );
}
