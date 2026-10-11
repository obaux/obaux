import { DUMMY_TRIPS } from '@pam/config/dummy-trips';
import { examplesOn } from './examples';

/** The example trips, or none for a real account (D-509, D-511). */
export function exampleTrips(): typeof DUMMY_TRIPS {
  return examplesOn() ? DUMMY_TRIPS : [];
}
