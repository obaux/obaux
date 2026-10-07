import { DUMMY_PROGRAM_LEADS } from '@pam/config/dummy-people';
import { DUMMY_SELF_ID, dummyConversationIdBetween, dummyConversationsFor } from '@pam/config/dummy-conversations';

/**
 * A message from this place's program the member has not answered yet
 * (D-305): the conversation, how many are new, and the newest words — so
 * the place's own page can say "New message" and open it, instead of the
 * member hunting for the program in Messages. Example conversations only,
 * like `messageHrefFor`; null when there is nothing new.
 */
export function newMessageFrom(placeName: string): { href: string; count: number; preview: string } | null {
  const lead = DUMMY_PROGRAM_LEADS.find((person) => person.orgName === placeName);
  if (!lead) return null;
  const id = dummyConversationIdBetween(DUMMY_SELF_ID.member, lead.id);
  const conversation = dummyConversationsFor('member').find((c) => c.id === id);
  if (!conversation?.unread || !conversation.preview) return null;
  return {
    href: `/messages/thread/?id=${encodeURIComponent(id)}`,
    count: conversation.unreadCount,
    preview: conversation.preview.body,
  };
}
