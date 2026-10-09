import { describe, expect, it } from 'vitest';
import { previewableLink } from '../../../../supabase/functions/link-preview/preview';
import { sharedLinkIn, shortLink, wantsPreview } from './linkPreview';

/**
 * The app and Pam's server must agree on which link a message is about
 * (D-407): the list shows that link, and the server makes its preview.
 */
const SAMPLES = [
  'Look: https://example.org/workshop. And https://example.com',
  '(see https://example.org/a?b=1),',
  'https://docs.google.com/document/d/x/edit and https://example.org',
  'https://drive.google.com/file/d/x/view',
  'http://example.org/plain',
  'no link here',
  '',
];

describe('a message\'s shared link', () => {
  it('is the same link the server previews', () => {
    for (const body of SAMPLES) {
      const app = wantsPreview(body) ? sharedLinkIn(body)!.toString() : null;
      expect(app, body).toBe(previewableLink(body));
    }
  });

  it('lists http links too, though only https gets a preview', () => {
    expect(sharedLinkIn('http://example.org/plain')?.hostname).toBe('example.org');
    expect(wantsPreview('http://example.org/plain')).toBe(false);
  });

  it('is a document, not a link, when a Google document is in it', () => {
    expect(sharedLinkIn('https://docs.google.com/document/d/x/edit')).toBeNull();
  });

  it('reads short without a title', () => {
    expect(shortLink(new URL('https://www.example-transit.org/route-47/'))).toBe('example-transit.org/route-47');
    expect(shortLink(new URL('https://example.org/'))).toBe('example.org');
  });
});
