/**
 * Short labels for the sections of each Support post, for the "On this page" list that follows the reader as they
 * scroll. Mira, 11 October: "a short label per section of every post (2–4 words, informative, not cute)".
 *
 * Sage writes the labels; Wren's post page reads them. Keyed by the post's slug, then by the section's full title
 * exactly as the post writes it. A section with no label here shows its full title. A test keeps every label to four
 * words at most.
 *
 * How to write one: the words a person would scan for. Say what is in the section, not what it is for. Plain words,
 * no puns, the post's own words where they are short enough.
 */
export const SECTION_LABELS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'is-the-place-told': {
    'Places that see your visit': 'Who sees it',
    'Places that are not told': 'Not told',
    'Before you go': 'Before you go',
    'If they didn’t know you were coming': 'They didn’t know',
    'If the place was wrong': 'The place was wrong',
    'For programs': 'For programs',
  },
  'cant-sign-in': {
    'Who can join, and how': 'Who can join',
    'I want to add my program': 'Add my program',
    'I want to be a case manager': 'Be a case manager',
    'The code didn’t come': 'Code didn’t come',
    'The code didn’t work': 'Code didn’t work',
    'The invite didn’t work': 'Invite didn’t work',
    'Still can’t get in?': 'Still can’t get in',
  },
  'your-safety': {
    'In danger right now?': 'In danger',
    'In crisis?': 'In crisis',
    'Tell Pam what happened': 'Tell Pam',
    'A message feels unsafe': 'Unsafe message',
  },
  'case-manager-assignments': {
    'A case manager looks after their own members': 'Who looks after you',
    'Every change to your account has a reason': 'Changes have a reason',
  },
  'keeping-your-listing-up-to-date': {
    'Small edits go live straight away': 'Small edits',
    'Big edits get a quick check first': 'Big edits',
    'Why the difference?': 'Why',
  },
  'signing-a-programs-rules': {
    'What a policy is': 'What a policy is',
    'How you sign': 'How you sign',
    'Signing never stops you booking a visit': 'You can still book',
    'What a program sees': 'What programs see',
    'A policy does not change after you sign': 'It won’t change',
    'What your signature means': 'Your signature',
    'For programs': 'For programs',
  },
  'start-here': {
    'The code didn’t come': 'Code didn’t come',
    'The code didn’t work': 'Code didn’t work',
    'The invite code or link didn’t work': 'Invite didn’t work',
    'You can’t send messages, or your account is paused': 'Messages or account off',
    'It says “You’re offline”': 'You’re offline',
    'It says “Something went wrong”, or the screen stays empty': 'Something went wrong',
    'A place is missing or wrong': 'A place is wrong',
  },
  'talking-to-pam': {
    'Start here, on the help desk': 'Find an answer',
    'Still stuck? Write to us': 'Write to us',
    'What we can help with': 'What we help with',
    'In danger right now?': 'In danger',
    'A message feels unsafe': 'Unsafe message',
  },
  'your-language': {
    'The languages': 'The languages',
    'Pick it when you join': 'Pick when you join',
    'Change it any time': 'Change it',
    'What follows your choice': 'What changes',
    'Good to know': 'Good to know',
  },
  'joining-pam': {
    'Which way is mine?': 'Three ways to join',
    'Step 1: sign in with your phone': 'Sign in',
    'Step 2: tell Pam about you': 'About you',
    'About links': 'About links',
  },
  'joining-as-staff': {
    'Join with your link': 'Join with a link',
    'If you do not have a link': 'No link yet',
    'If your number is already in Pam': 'Number already in Pam',
  },
  'messages-in-pam': {
    'Who can write to whom': 'Who can write',
    'Send a message': 'Send a message',
    'A new message does not come by text': 'No text for messages',
    'If a message is not safe': 'Report a message',
    'If you do not want messages from someone': 'Block someone',
  },
  'one-phone-two-sides': {
    'Switch sides': 'Switch sides',
    'What stays separate': 'What stays separate',
    'Add your program to an account you already have': 'Add your program',
  },
  'pam-words': {
    'The words': 'The words',
  },
  'planning-a-visit': {
    'Plan a visit': 'Plan a visit',
    'Change a visit': 'Change a visit',
    'Cancel a visit': 'Cancel a visit',
    'Past visits': 'Past visits',
    Reminders: 'Reminders',
    Points: 'Points',
  },
  'points-and-badges': {
    'How you earn points today': 'Earn points',
    Levels: 'Levels',
    Badges: 'Badges',
    'Who can see your points': 'Who sees points',
    'See your points': 'Find your points',
  },
  'sending-an-invite': {
    'Who can invite whom': 'Who can invite',
    'Make an invite': 'Make an invite',
    'What to know about a link': 'About links',
    'Seeing who joined (super admins)': 'Who joined',
  },
  'staff-requests': {
    'Where requests are': 'Find requests',
    'Decide a request': 'Approve or deny',
  },
  'texts-from-pam': {
    'The texts Pam sends today': 'Texts sent today',
    'Texts Pam does not send yet': 'Not sent yet',
    'The rules': 'The rules',
    'A text did not come': 'A text didn’t come',
  },
  'what-others-can-see': {
    'The short version': 'Short version',
    'Who can see what': 'Who sees what',
    'If someone reports a message': 'Reported messages',
    'If this ever changes': 'If this changes',
  },
  'who-is-my-guide': {
    'Do I have a guide?': 'Do I have one?',
    'What your guide can see': 'What guides see',
    'Find it in the app': 'In the app',
  },
};
