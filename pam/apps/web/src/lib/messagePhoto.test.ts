import { describe, expect, it } from 'vitest';
import { MESSAGE_PHOTO_ACCEPT, photoType } from './messagePhoto';

// D-408: "Images, any jpeg, png. Or iPhone photo."
describe('photoType', () => {
  it('takes a JPEG and a PNG, by type or, when the type is missing, by name', () => {
    expect(photoType({ name: 'a.jpg', type: 'image/jpeg' })).toBe('jpeg');
    expect(photoType({ name: 'a', type: 'image/pjpeg' })).toBe('jpeg');
    expect(photoType({ name: 'IMG_1.JPEG', type: '' })).toBe('jpeg');
    expect(photoType({ name: 'shot.png', type: 'image/png' })).toBe('png');
    expect(photoType({ name: 'shot.PNG', type: 'application/octet-stream' })).toBe('png');
  });

  it('takes an iPhone photo (HEIC or HEIF)', () => {
    expect(photoType({ name: 'IMG_0412.HEIC', type: 'image/heic' })).toBe('heic');
    expect(photoType({ name: 'x', type: 'image/heif' })).toBe('heic');
    expect(photoType({ name: 'IMG_0412.heic', type: '' })).toBe('heic');
  });

  it('turns down every other picture, and anything that only calls itself one', () => {
    for (const type of ['image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff', 'image/avif']) {
      expect(photoType({ name: 'a.jpg', type })).toBeNull();
    }
    expect(photoType({ name: 'a.gif', type: '' })).toBeNull();
    expect(photoType({ name: 'letter.pdf', type: 'application/pdf' })).toBeNull();
    expect(photoType({ name: 'jpg', type: '' })).toBeNull();
  });

  it('asks the phone for JPEG or PNG only, so an iPhone converts its own photos', () => {
    expect(MESSAGE_PHOTO_ACCEPT.split(',')).toEqual(['image/jpeg', 'image/png']);
  });
});
