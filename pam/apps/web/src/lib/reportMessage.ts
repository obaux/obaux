'use client';

import { codeFromError, type ActionResult } from './reportAppError';

/**
 * Says a message is not safe (D-177).
 *
 * `report_message()` (0034) does the part that matters: it copies the quote
 * from the row itself, refuses a message the caller sent, and refuses one
 * from a conversation the caller is not in. `reason` is one of
 * `MESSAGE_REPORT_REASONS`' keys, stored as-is — the words a reviewer reads
 * come from the locale bundle at render time, the same way a place flag's
 * reason does (0036), so nobody's free text lands in front of somebody with
 * power over them. Answers `ok: false` with its code when refused or offline; the screen says
 * so with the small alert, never silently.
 */
export async function reportMessage(messageId: string, reason: string): Promise<ActionResult> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('report_message', {
      p_message_id: messageId,
      p_reason: reason,
    });
    return error ? { ok: false, code: codeFromError(error) } : { ok: true };
  } catch (caught) {
    return { ok: false, code: codeFromError(caught) };
  }
}
