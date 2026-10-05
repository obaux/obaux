'use client';

import type { Role } from '@pam/config';
import { HeaderBell } from '../app/HeaderBell';
import { HelpButton } from './HelpButton';

/**
 * The redesign's header actions: the notifications bell, then Help (D-210).
 * Help sits here on every redesigned screen — the bottom bar no longer has it.
 */
export function HeaderActions({
  role = 'member',
  enabled = true,
  hasHelp = true,
}: {
  readonly role?: Role | null;
  readonly enabled?: boolean;
  /** Off on Messages, where New message takes Help's place (D-220). */
  readonly hasHelp?: boolean;
}) {
  return (
    <>
      <HeaderBell enabled={enabled} role={role} appearance="round" />
      {hasHelp ? <HelpButton /> : null}
    </>
  );
}
