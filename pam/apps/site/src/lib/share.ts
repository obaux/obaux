/**
 * What the site says about itself when it is shared or bookmarked: one place, read
 * by the page metadata (`app/layout.tsx`) and by Storybook's Website › Share and
 * icon preview, so the preview is the real thing and not a copy of it.
 */
export const TAGLINE = 'City services in your pocket';
export const SHARE_TITLE = `Pam — ${TAGLINE}`;
export const SHARE_DESCRIPTION = 'Pam helps you find people and places that can help.';
/** Under `public/`; drawn from `social/preview.html` by `social/render.mjs`. */
export const SHARE_IMAGE = { url: '/og/social.png', width: 1200, height: 630, alt: SHARE_TITLE } as const;
