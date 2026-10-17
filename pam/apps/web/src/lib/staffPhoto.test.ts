import { describe, expect, it } from 'vitest';
import { olderPhotos } from './staffPhoto';

describe('olderPhotos', () => {
  it('names every other file in the folder, and never the photo just saved (D-587)', () => {
    expect(olderPhotos('u1', ['100.webp', '200.webp', '300.webp'], 'u1/300.webp')).toEqual(['u1/100.webp', 'u1/200.webp']);
  });
  it('is empty when the new photo is the only file', () => {
    expect(olderPhotos('u1', ['300.webp'], 'u1/300.webp')).toEqual([]);
  });
});
