import { Body, Lead, P, Section } from '../components/Prose';
import { Steps } from '../components/Steps';

/**
 * Support post (DRAFT, held): Staff requests, for super admins. The review side is built
 * (the Requests screen, Approve and Deny, and the texts), but nothing in the app lets a
 * person ask any more — staff join by invite link only (D-369) — so the list is empty.
 * Publish only if a way to ask comes back (remove `status: 'draft'`).
 */
export function StaffRequests() {
  return (
    <Body>
      <Lead>
        When someone asks to be a case manager or a program lead, the request waits for a super admin. Here is
        where to find it, and what Approve and Deny do.
      </Lead>

      <Section title="Where requests are">
        <P>A super admin’s Home is the Requests list. It also opens from Profile, under “Staff requests”.</P>
      </Section>

      <Section title="Decide a request">
        <Steps
          items={[
            'Tap a request in the list.',
            'Read the name and what they asked to be. If you need to ask them something, tap “Text” their name.',
            'Choose the city this account is for. If Pam is in only one city, it is chosen for you.',
            'Tap “Approve” or “Deny”.',
          ]}
        />
        <P>
          Approve makes the account right away and texts the person that it was approved. Deny makes no account
          and texts the person that it was not approved.
        </P>
      </Section>
    </Body>
  );
}
