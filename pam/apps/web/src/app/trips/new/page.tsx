'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { NewTripView } from '../../../screens/NewTripView';

/**
 * New trip (D-225): where, when, check. Opened from a place's "Schedule a
 * visit" (D-235) it carries that place, and starts at When.
 */
function NewTrip() {
  const params = useSearchParams();
  const id = params.get('place');
  const name = params.get('name');
  const category = params.get('category');
  const address = params.get('address');
  // From a place's "Change appointment" (D-281).
  const change = params.get('change');
  // From a program's "Book a visit for a member" (D-316): who it is for.
  const forId = params.get('for');
  const forName = params.get('forName');
  // Somebody new to Pam (D-322): their number, so they can be texted a link.
  const forPhone = params.get('forPhone');
  // From a service's own page (D-313): the visit is for that service.
  const service = params.get('service');
  // A trip already booked (D-333): its booked screen, with Bring a friend.
  const booked = params.get('booked');
  const seed = useMemo(() => (id ? { id, name, category, address } : null), [id, name, category, address]);
  const forMember = useMemo(
    () => (forId ? { id: forId, name: forName ?? '', ...(forPhone ? { phone: forPhone } : {}) } : null),
    [forId, forName, forPhone],
  );
  return (
    <NewTripView initialPlace={seed} initialService={service} changing={change} forMember={forMember} booked={booked} />
  );
}

export default function NewTripPage() {
  return (
    <Suspense fallback={<NewTripView />}>
      <NewTrip />
    </Suspense>
  );
}
