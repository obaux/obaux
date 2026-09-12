import { describe, expect, it } from 'vitest';
import {
  POINTS_RULES,
  LEVELS,
  levelForPoints,
  nextLevel,
  progressToNextLevel,
  streakPoints,
  STREAK_POINTS_CAP,
  LEADERBOARDS_ENABLED,
  REWARDS_ENABLED,
} from '../src/points.js';

describe('points rules (SOP §8)', () => {
  it('never awards points for merely using the app', () => {
    // §8: "Points reward real-world action, not app usage." Every rule must name
    // something that happened off the phone, or be the one-time setup award.
    const appUsageWords = ['open', 'view', 'browse', 'scroll', 'login', 'tap around'];
    for (const rule of Object.values(POINTS_RULES)) {
      for (const word of appUsageWords) {
        expect(rule.reason.toLowerCase()).not.toContain(word);
      }
    }
  });

  it('awards fewer points for self-reported attendance than verified', () => {
    // Lower confidence must be worth less, or the verified path is pointless.
    expect(POINTS_RULES.attend_appointment_sms.points).toBeLessThan(
      POINTS_RULES.attend_appointment_verified.points,
    );
  });

  it('caps self-reported signups so points cannot be farmed', () => {
    expect(POINTS_RULES.self_reported_signup.dailyCap).toBe(3);
    expect(POINTS_RULES.reach_out_to_buddy.dailyCap).toBe(1);
  });

  it('uses the exact values from the SOP table', () => {
    expect(POINTS_RULES.save_place.points).toBe(5);
    expect(POINTS_RULES.call_service.points).toBe(10);
    expect(POINTS_RULES.self_reported_signup.points).toBe(25);
    expect(POINTS_RULES.enrollment_approved.points).toBe(50);
    expect(POINTS_RULES.attend_appointment_verified.points).toBe(100);
    expect(POINTS_RULES.attend_appointment_sms.points).toBe(60);
    expect(POINTS_RULES.connect_with_mentor.points).toBe(30);
    expect(POINTS_RULES.refer_someone.points).toBe(100);
  });
});

describe('streaks', () => {
  it('pays 50 per consecutive week', () => {
    expect(streakPoints(1)).toBe(50);
    expect(streakPoints(4)).toBe(200);
  });

  it('caps at 300 however long the streak runs', () => {
    expect(streakPoints(6)).toBe(STREAK_POINTS_CAP);
    expect(streakPoints(52)).toBe(STREAK_POINTS_CAP);
  });

  it('pays nothing for a broken streak', () => {
    expect(streakPoints(0)).toBe(0);
    expect(streakPoints(-3)).toBe(0);
  });
});

describe('levels', () => {
  it('ascends and starts at zero, so a new member is never below the first level', () => {
    expect(LEVELS[0]!.minPoints).toBe(0);
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i]!.minPoints).toBeGreaterThan(LEVELS[i - 1]!.minPoints);
    }
  });

  it.each([
    [0, 'Starting Out'],
    [249, 'Starting Out'],
    [250, 'Getting Going'],
    [749, 'Getting Going'],
    [750, 'On My Way'],
    [2000, 'Steady'],
    [4999, 'Steady'],
    [5000, 'Leader'],
    [999999, 'Leader'],
  ])('puts %i points at %s', (points, name) => {
    expect(levelForPoints(points).name).toBe(name);
  });

  it('reports no next level at the top', () => {
    expect(nextLevel(5000)).toBeNull();
    expect(progressToNextLevel(5000)).toBe(1);
  });

  it('reports progress between levels', () => {
    expect(progressToNextLevel(0)).toBe(0);
    expect(progressToNextLevel(125)).toBeCloseTo(0.5, 5);
    expect(progressToNextLevel(500)).toBeCloseTo(0.5, 5);
  });
});

describe('product guardrails', () => {
  it('ships with leaderboards off — comparison is harmful here (§8)', () => {
    expect(LEADERBOARDS_ENABLED).toBe(false);
  });

  it('ships with rewards off pending Will’s decision (§8 [ASK WILL])', () => {
    expect(REWARDS_ENABLED).toBe(false);
  });
});
