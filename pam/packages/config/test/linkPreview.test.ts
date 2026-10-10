import { describe, expect, it } from 'vitest';
import {
  addressAllowed,
  cleanText,
  imageExtension,
  isPrivateAddress,
  messageIdsFrom,
  parsePreview,
  previewableLink,
} from '../../../supabase/functions/link-preview/preview.ts';

/**
 * The link-preview function opens web pages on a member's say-so (D-407).
 * These tests hold the line on what it may open — never a private, local or
 * reserved address, however it is written — and on what it takes from a page.
 */
describe('which link gets a preview', () => {
  it('is the first https link in the message', () => {
    expect(previewableLink('Look: https://example.org/workshop. And https://example.com')).toBe('https://example.org/workshop');
  });
  it('drops punctuation that ends a sentence', () => {
    expect(previewableLink('(see https://example.org/a?b=1),')).toBe('https://example.org/a?b=1');
  });
  it('is none for a message with a Google document in it — that shows as a document', () => {
    expect(previewableLink('https://docs.google.com/document/d/x/edit and https://example.org')).toBeNull();
    expect(previewableLink('https://drive.google.com/file/d/x/view')).toBeNull();
  });
  it('is none for plain http, or no link', () => {
    expect(previewableLink('http://example.org')).toBeNull();
    expect(previewableLink('no link here')).toBeNull();
    expect(previewableLink(null)).toBeNull();
  });
});

describe('what Pam\'s server may open', () => {
  const ok = (u: string) => addressAllowed(new URL(u));
  it('opens public https pages', () => {
    expect(ok('https://example.org/workshop')).toBe(true);
    expect(ok('https://www.example.org:443/a')).toBe(true);
    expect(ok('https://93.184.216.34/')).toBe(true);
  });
  it('refuses anything but https on the usual port', () => {
    expect(ok('http://example.org')).toBe(false);
    expect(ok('https://example.org:8443/')).toBe(false);
    expect(ok('ftp://example.org')).toBe(false);
  });
  it('refuses a user name or password in the address', () => {
    expect(ok('https://user:pass@example.org/')).toBe(false);
  });
  it('refuses local names', () => {
    for (const u of ['https://localhost/', 'https://intranet/', 'https://printer.local/', 'https://db.internal/', 'https://router.home.arpa/', 'https://x.localhost/']) {
      expect(ok(u), u).toBe(false);
    }
  });
  it('refuses private, loopback, link-local and metadata addresses, however written', () => {
    for (const u of [
      'https://127.0.0.1/',
      'https://10.0.0.5/',
      'https://172.16.3.4/',
      'https://192.168.1.1/',
      'https://169.254.169.254/latest/meta-data/',
      'https://100.64.0.1/',
      'https://0.0.0.0/',
      'https://[::1]/',
      'https://[fd00::1]/',
      'https://[fe80::1]/',
      'https://[::ffff:127.0.0.1]/',
      'https://[::ffff:a9fe:a9fe]/',
      'https://[64:ff9b::a00:1]/',
      'https://2130706433/',
      'https://0x7f000001/',
    ]) {
      expect(ok(u), u).toBe(false);
    }
  });
});

describe('addresses a name resolves to', () => {
  it('tells private from public', () => {
    expect(isPrivateAddress('8.8.8.8')).toBe(false);
    expect(isPrivateAddress('2606:4700::1111')).toBe(false);
    expect(isPrivateAddress('10.1.2.3')).toBe(true);
    expect(isPrivateAddress('172.31.255.255')).toBe(true);
    expect(isPrivateAddress('172.32.0.1')).toBe(false);
    expect(isPrivateAddress('224.0.0.1')).toBe(true);
    expect(isPrivateAddress('::')).toBe(true);
    expect(isPrivateAddress('fc00::')).toBe(true);
    expect(isPrivateAddress('2001:db8::1')).toBe(true);
    expect(isPrivateAddress('2002:0a00:0001::')).toBe(true);
  });
  it('treats anything that is not an address as private', () => {
    expect(isPrivateAddress('not-an-ip')).toBe(true);
    expect(isPrivateAddress('1.2.3')).toBe(true);
  });
});

describe('what it takes from a page', () => {
  const page = `<!doctype html><html><head>
    <title>Fallback title</title>
    <meta property="og:title" content="Free resume workshop &amp; lunch">
    <meta property="og:site_name" content='Example Library'>
    <meta property="og:image" content="/img/workshop.jpg">
    </head><body><meta property="og:title" content="not this"></body></html>`;

  it('reads Open Graph first, resolves the picture against the page', () => {
    expect(parsePreview(page, 'https://example.org/events/1')).toEqual({
      title: 'Free resume workshop & lunch',
      site: 'Example Library',
      image: 'https://example.org/img/workshop.jpg',
    });
  });

  it('falls back to <title> and the host', () => {
    expect(parsePreview('<head><title> Route 47\n times </title></head>', 'https://www.example-transit.org/r/47')).toEqual({
      title: 'Route 47 times',
      site: 'example-transit.org',
      image: null,
    });
  });

  it('keeps only an https picture', () => {
    const p = parsePreview('<head><meta name="twitter:image" content="http://example.org/a.png"></head>', 'https://example.org/');
    expect(p.image).toBeNull();
  });

  it('keeps titles to one clean line of 300 characters', () => {
    expect(cleanText('a\u0000b\n\tc', 300)).toBe('a b c');
    expect([...cleanText('x'.repeat(400), 300)!].length).toBe(300);
    expect(cleanText('   ', 300)).toBeNull();
  });
});

describe('what it keeps and what it is asked', () => {
  it('keeps only pictures', () => {
    expect(imageExtension('image/jpeg')).toBe('jpg');
    expect(imageExtension('image/png; charset=binary')).toBe('png');
    expect(imageExtension('image/svg+xml')).toBeNull();
    expect(imageExtension('text/html')).toBeNull();
  });
  it('takes ten real message ids at most', () => {
    const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
    expect(messageIdsFrom({ message_ids: Array.from({ length: 20 }, (_, i) => id(i)) })).toHaveLength(10);
    expect(messageIdsFrom({ message_ids: ['1; drop table', id(1), id(1)] })).toEqual([id(1)]);
    expect(messageIdsFrom(null)).toEqual([]);
  });
});
