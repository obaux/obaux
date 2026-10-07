import { describe, expect, it } from 'vitest';
import { BADGES } from '@pam/config';
import { BADGE_ART_KEYS } from '../src/BadgeArt';

/**
 * Every badge has a picture (D-295). A new badge added to config without one
 * would quietly fall back to the first rung's door — fail here instead.
 */
describe('badge pictures', () => {
  it('draws every badge in config, and nothing that is not a badge', () => {
    expect([...BADGE_ART_KEYS].sort()).toEqual(BADGES.map((b) => b.key).sort());
  });
});
