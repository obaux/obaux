import { SITE_URL } from './project';

/**
 * The help desk: the support centre on the public website (A28, Will, 11 October 2026).
 *
 * Pam has no phone line. A person who is stuck is shown answers here first, and the help
 * desk's "Still stuck?" is the way to an email to Pam after that. The app's Help screen, the
 * privacy Copy and Delete pages and the Your safety row all lead here.
 */
export const HELP_DESK_URL = `${SITE_URL}/support/`;

/**
 * The "Your safety" post on the help desk (Wren, 11 October 2026): it opens with 911, says Pam is not an
 * emergency service, and offers the write-in straight away. "Talk to someone now" on Your safety opens it.
 * The website's own test guards that a post with this address exists.
 */
export const HELP_SAFETY_URL = `${HELP_DESK_URL}your-safety/`;
