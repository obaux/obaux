'use client';

/**
 * Finds the conversation a case manager or program admin already has with
 * `otherId` (a member), or starts one. Returns the conversation id to
 * navigate to, or `null` if the write failed.
 *
 * Only ever called from staff's own "Start a conversation" list — a member
 * never calls this (see `/messages/page.tsx`: a member gets no "start"
 * affordance at all).
 *
 * Two inserts, both already allowed by RLS: `conversations_insert_participant`
 * (an active account, `chat` on — which it always is, see 0031) creates the
 * row, then `conversation_members_insert` lets the caller add themselves
 * (`profile_id = auth.uid()`) and, once they are a member, add the other
 * person too (`in_conversation(conversation_id)`). Nothing here bypasses RLS;
 * the caller is responsible for only ever passing an `otherId` this account is
 * actually allowed to reach — see `useMessageableMembers`, and D-152 for the
 * RLS gap that leaves as the enforcement of "actually allowed" a client-side
 * property today, not a database one.
 */
export async function openConversation(otherId: string): Promise<string | null> {
  const kind = 'direct' as const;
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const me = auth.user.id;

    const { data: mine, error: mineError } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('profile_id', me);
    if (mineError) return null;

    const myIds = (mine ?? []).map((row) => row.conversation_id as string);
    if (myIds.length > 0) {
      const { data: shared, error: sharedError } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('profile_id', otherId)
        .in('conversation_id', myIds)
        .limit(1);
      if (sharedError) return null;
      if (shared && shared.length > 0) return shared[0]!.conversation_id as string;
    }

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({ kind })
      .select('id')
      .single();
    if (convError || !conversation) return null;

    const conversationId = conversation.id as string;
    const { error: membersError } = await supabase.from('conversation_members').insert([
      { conversation_id: conversationId, profile_id: me },
      { conversation_id: conversationId, profile_id: otherId },
    ]);
    if (membersError) return null;

    return conversationId;
  } catch {
    return null;
  }
}
