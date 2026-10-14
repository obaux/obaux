import { join } from 'node:path';
import { HOW_TO_BUILD, whyNotTestable } from './liveGuard';

/** Refuses to run the suite against a build that could reach the live project (D-576; see liveGuard.ts). */
export default function globalSetup(): void {
  const reason = whyNotTestable(join(process.cwd(), 'out'));
  if (reason) {
    throw new Error(`The e2e suite will not run: ${reason}.\n${HOW_TO_BUILD}\nNothing was sent anywhere.`);
  }
}
