/**
 * What people type into Support's search, in their own words, and where it
 * should take them. This file is the use cases: Sage writes the phrases, Wren's
 * search (`lib/search.ts`) reads them, and `test/search.test.ts` runs every one
 * through the real search.
 *
 * - `phrase` is how a person would say it, the way they would say it out loud:
 *   "why is this happening", "I did not get a code". Plain words, no jargon.
 * - `post` is the slug of the published post that should come first for that
 *   phrase, or `null` when no post answers it yet. A `null` phrase is a gap:
 *   it must also be listed in `docs/help-centre-gaps.md` (the test checks), and
 *   the page tells the person plainly that there is no article for it yet.
 * - `use` is one line of the use case: who is asking and what has just happened
 *   to them. It is for the people who write the posts; it is never shown.
 *
 * English only for now.
 */
export interface SearchPhrase {
  readonly phrase: string;
  readonly post: string | null;
  readonly use: string;
}

export const SEARCH_PHRASES: readonly SearchPhrase[] = [
  { phrase: 'why didnt i get a code', post: 'texts-from-pam', use: 'Someone on the sign-in screen waiting for the text with their code.' },
  { phrase: 'the code is not coming', post: 'texts-from-pam', use: 'Someone who asked for a sign-in code a few minutes ago and has nothing.' },
  { phrase: 'i did not get a text', post: 'texts-from-pam', use: 'Anyone expecting a text from Pam that never came.' },
  { phrase: 'pam didnt text me', post: 'texts-from-pam', use: 'Anyone expecting a text from Pam that never came.' },
  { phrase: 'how do i stop the texts', post: 'texts-from-pam', use: 'Someone who wants Pam to stop texting them.' },
  { phrase: 'i want texts again', post: 'texts-from-pam', use: 'Someone who replied STOP and now wants texts back.' },
  { phrase: 'why didnt i get a reminder', post: 'texts-from-pam', use: 'A resident who planned a visit and expected a reminder the day before (not sent yet).' },
  { phrase: 'the code doesnt work', post: 'joining-pam', use: 'Someone who typed a code and was told it did not work.' },
  { phrase: 'i cant sign in', post: 'joining-pam', use: 'Someone stuck on the sign-in screen.' },
  { phrase: 'it says that code is too old', post: 'joining-pam', use: 'A resident whose invite code has expired.' },
  { phrase: 'my link to join is too old', post: 'joining-pam', use: 'Someone who tapped an invite link and was told it is too old.' },
  { phrase: 'the code is for a different phone', post: 'joining-pam', use: 'A resident joining on a phone that is not the one the code was sent to.' },
  { phrase: 'how do i join', post: 'joining-pam', use: 'Someone who heard about Pam and wants in.' },
  { phrase: 'i dont have a code', post: 'joining-pam', use: 'Someone who wants to join but nobody gave them a code.' },
  { phrase: 'pam is not in my city', post: 'joining-pam', use: 'Someone who was told Pam is not in their city yet.' },
  { phrase: 'how do i join as staff', post: 'joining-as-staff', use: 'A case manager or provider who wants an account.' },
  { phrase: 'i didnt get my invite email', post: 'joining-as-staff', use: 'A provider or case manager waiting for the email that opens their account.' },
  { phrase: 'who can see this', post: 'what-others-can-see', use: 'A resident about to share something and unsure who sees it.' },
  { phrase: 'can my case manager read my messages', post: 'what-others-can-see', use: 'A resident worried their chats are read.' },
  { phrase: 'is this private', post: 'what-others-can-see', use: 'A resident deciding whether to use Pam at all.' },
  { phrase: 'does my probation officer see this', post: 'what-others-can-see', use: 'A resident whose guide is a probation officer, worried about what they see.' },
  { phrase: 'what does the program see about me', post: 'what-others-can-see', use: 'A resident about to sign a program\'s policies or plan a visit.' },
  { phrase: 'who is my guide', post: 'who-is-my-guide', use: 'A resident who keeps reading \'your guide\' and does not know who that is.' },
  { phrase: 'i dont have a case manager', post: 'who-is-my-guide', use: 'A resident who joined on their own and has nobody assigned.' },
  { phrase: 'my guide does not answer', post: 'who-is-my-guide', use: 'A resident who messaged their guide and heard nothing.' },
  { phrase: 'change my case manager', post: 'case-manager-assignments', use: 'A resident who wants a different case manager.' },
  { phrase: 'why cant i send messages', post: 'case-manager-assignments', use: 'A resident whose messages are turned off by their guide.' },
  { phrase: 'my account is paused', post: 'case-manager-assignments', use: 'A resident who cannot sign in because their account is paused.' },
  { phrase: 'i cant find my client', post: 'case-manager-assignments', use: 'A case manager looking for someone who is not on their list.' },
  { phrase: 'how do i plan a visit', post: 'planning-a-visit', use: 'A resident who found a place and wants to go.' },
  { phrase: 'cancel my appointment', post: 'planning-a-visit', use: 'A resident who cannot make a visit they planned.' },
  { phrase: 'change the time of my visit', post: 'planning-a-visit', use: 'A resident who needs a different day or time.' },
  { phrase: 'where are my old visits', post: 'planning-a-visit', use: 'A resident looking for a visit that has passed.' },
  { phrase: 'what am i signing', post: 'signing-a-programs-rules', use: 'A resident asked to sign a program\'s policy before a visit.' },
  { phrase: 'do i have to sign the rules', post: 'signing-a-programs-rules', use: 'A resident unsure whether signing is required.' },
  { phrase: 'how do i message my case manager', post: 'messages-in-pam', use: 'A resident who wants to write to their guide.' },
  { phrase: 'someone is bothering me', post: 'messages-in-pam', use: 'Anyone getting messages they do not want.' },
  { phrase: 'block someone', post: 'messages-in-pam', use: 'Anyone who wants a person to stop writing to them.' },
  { phrase: 'report a message', post: 'messages-in-pam', use: 'Anyone who got a message that feels wrong.' },
  { phrase: 'i feel unsafe', post: 'messages-in-pam', use: 'Anyone who feels unsafe because of a message. (The app\'s Help also says: in danger, call 911.)' },
  { phrase: 'how do i get points', post: 'points-and-badges', use: 'A resident who saw their points and wants more.' },
  { phrase: 'what are points for', post: 'points-and-badges', use: 'A resident wondering if points are worth anything.' },
  { phrase: 'what does guide mean', post: 'who-is-my-guide', use: 'Anyone who met a Pam word they do not know.' },
  { phrase: 'what does this word mean', post: 'pam-words', use: 'Anyone who met a Pam word they do not know.' },
  { phrase: 'use pam for myself and my program', post: 'one-phone-two-sides', use: 'A provider who also uses Pam as a resident.' },
  { phrase: 'how do i invite someone', post: 'sending-an-invite', use: 'A case manager who wants to bring a person into Pam.' },
  { phrase: 'the invite link i sent expired', post: 'sending-an-invite', use: 'A case manager whose invite was not used in time.' },
  { phrase: 'what can i see about my people', post: 'what-others-can-see', use: 'A case manager unsure what Pam shows them, and what it does not.' },
  { phrase: 'why is this happening', post: null, use: 'Anyone on a screen that is not doing what they expected, who does not know what to ask.' },
  { phrase: 'something went wrong', post: null, use: 'Anyone who just saw an error.' },
  { phrase: 'the page is blank', post: null, use: 'Anyone looking at an empty screen.' },
  { phrase: 'it wont load', post: null, use: 'Anyone on a slow or dropped connection.' },
  { phrase: 'how do i talk to a real person', post: null, use: 'Anyone who wants a human, now.' },
  { phrase: 'pam phone number', post: null, use: 'Anyone looking for the number to call.' },
  { phrase: 'change my language', post: null, use: 'Anyone reading Pam in a language that is not theirs.' },
  { phrase: 'i got a new phone number', post: null, use: 'Anyone who changed numbers and worries about signing in.' },
  { phrase: 'delete my account', post: null, use: 'Anyone who wants to leave Pam.' },
  { phrase: 'where can i find food', post: null, use: 'A resident looking for help near them for the first time.' },
  { phrase: 'find a job', post: null, use: 'A resident looking for work.' },
  { phrase: 'this place is closed', post: null, use: 'A resident who went to a place and found it closed or moved.' },
  { phrase: 'does the place know im coming', post: null, use: 'A resident who planned a visit and wonders if the place expects them.' },
  { phrase: 'they said i missed it', post: null, use: 'A resident told they missed a visit they think they made.' },
  { phrase: 'how do i add my program', post: null, use: 'A provider who just joined and wants their program on Pam.' },
  { phrase: 'my program is still in review', post: null, use: 'A provider waiting for Pam to approve their program.' },
  { phrase: 'who is coming to my program', post: null, use: 'A provider who wants to see the week\'s visits.' },
  { phrase: 'why wasnt i told about a visit', post: null, use: 'A provider who learned of a visit late, or not at all.' },
  { phrase: 'approve a staff request', post: null, use: 'A super admin with a request waiting.' },
];
