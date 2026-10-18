import { describe, expect, it, beforeEach } from 'vitest';
import { NEXT_ALLOWED, rememberNext, safeNext, takeNext } from './signinNext';

/** A way on after Sign in is one of a short list of Pam's own screens, and nothing else (S1). */
describe('safeNext', () => {
  it('accepts a listed screen, with or without its closing slash', () => {
    expect(safeNext('/profile/add-program/')).toBe('/profile/add-program/');
    expect(safeNext('/profile/add-program')).toBe('/profile/add-program/');
    expect(safeNext('/messages/pam')).toBe('/messages/pam/');
    expect(NEXT_ALLOWED).toEqual(['/profile/add-program/', '/messages/pam/']);
  });
  it('refuses everything else: another screen, an outside address, a scheme, a double slash, a backslash, a query', () => {
    for (const bad of [
      '/', '/profile/', '/admin/', '/profile/add-program/../../admin/', 'https://evil.example/', 'http://evil.example', '//evil.example/',
      '/\\evil.example', 'javascript:alert(1)', '/profile/add-program/?x=1', '/profile/add-program/#x', ' /profile/add-program/', '', null, undefined,
    ]) {
      expect(safeNext(bad as string | null | undefined), String(bad)).toBeNull();
    }
  });
});

describe('remembering it for the length of the sign-up', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    (globalThis as unknown as { window: unknown }).window = {
      sessionStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    };
  });
  it('keeps a listed screen, uses it once, and forgets it', () => {
    rememberNext('/profile/add-program/');
    expect(takeNext('member')).toBe('/profile/add-program/');
    expect(takeNext('member')).toBeNull();
  });
  it('keeps nothing that is not listed', () => {
    rememberNext('https://evil.example/');
    rememberNext('/admin/');
    expect(takeNext()).toBeNull();
  });
  it('is taken only by a member, and forgotten for anybody else: a lead, a case manager, a super admin', () => {
    for (const role of ['provider', 'admin', 'super_admin']) {
      rememberNext('/profile/add-program/');
      expect(takeNext(role), role).toBeNull();
      expect(takeNext('member'), role).toBeNull();
    }
  });

  it('is a brand-new account\'s too, which is a member (no role yet)', () => {
    rememberNext('/profile/add-program/');
    expect(takeNext()).toBe('/profile/add-program/');
  });
});

describe('the way back to Pam (D-605)', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    (globalThis as unknown as { window: unknown }).window = {
      sessionStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    };
  });
  it('is for every role but the Pam team, once', () => {
    for (const role of ['member', 'admin', 'provider', undefined]) {
      rememberNext('/messages/pam/');
      expect(takeNext(role), String(role)).toBe('/messages/pam/');
      expect(takeNext(role)).toBeNull();
    }
    rememberNext('/messages/pam/');
    expect(takeNext('super_admin')).toBeNull();
  });
  it('does not widen Add my program, which stays for members', () => {
    rememberNext('/profile/add-program/');
    expect(takeNext('provider')).toBeNull();
  });
});
