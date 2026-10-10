'use client';

import { ExploreScreen } from '../../screens/ExploreScreen';
import { TabGate } from '../TabGate';

/** All programs (D-218): the catalogue as a staff member's secondary path. */
export default function ProgramsPage() {
  return (
    <TabGate>
      <ExploreScreen mode="programs" />
    </TabGate>
  );
}
