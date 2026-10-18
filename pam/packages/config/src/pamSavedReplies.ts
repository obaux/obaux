/**
 * The Pam team's saved replies (card a100, D-605): fixed words a super admin can put in the composer of a Pam
 * conversation, edit, and send. Sage's (claude/sage-signs @ fb410c60), in seven languages, never edited in the app, and
 * with no justice words.
 *
 * The legal reply ("We can't give legal advice…") is not here yet: it names free legal help, and that list needs a
 * lawyer's reading first (Iris, Sage). It joins this list, as `pam.saved.legal`, once the list is approved.
 */
export const PAM_SAVED_REPLIES = ['pam.saved.guide', 'pam.saved.program', 'pam.saved.aboutMember'] as const;
