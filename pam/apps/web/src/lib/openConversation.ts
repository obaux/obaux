'use client';

/**
 * Finds the conversation the caller already has with `otherId`, or starts
 * one. Returns the conversation id to navigate to, or `null` if it was
 * refused or the write failed.
 *
 * One RPC, `open_direct_conversation()` (0063, D-176), which is now the only
 * way a conversation comes to exist: the direct insert policies on
 * `conversations` and `conversation_members` are gone. The relationship
 * check — a case manager and a member on their active caseload, a program
 * admin and a member enrolled in their org's service, in either direction —
 * lives inside that function, so nothing this file passes can widen it:
 * an id that is not on `messageable_people()`'s list is refused by the
 * database, not merely absent from the screen (closing the gap D-163 left
 * open). A member calls this too now, to reach their own case manager or
 * program (D-176, superseding "a member starts nothing").
 */
export async function openConversation(otherId: string): Promise<string | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('open_direct_conversation', {
      p_other: otherId,
    });
    if (error || typeof data !== 'string') return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * A member's message to a place's program, before or without a visit (D-541):
 * `message_program()` opens, or reuses, the conversation with one lead of the
 * place's organisation and returns its id. `null` when the place has nobody on
 * Pam to answer (`NO_PROGRAM_LEAD`) or the write failed — the screen then shows
 * Call and Website instead of a dead end.
 */
export async function messageProgram(serviceId: string): Promise<string | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('message_program', { p_service_id: serviceId });
    if (error || typeof data !== 'string') return null;
    return data;
  } catch {
    return null;
  }
}
