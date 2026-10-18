import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';

/**
 * Message Pam's words are Sage's (D-605; her drafts fb410c60 and a2696fa8, 18 October 2026, on card a100). This test is the pin: the
 * English below is what she wrote, and the English in the app must be the same, so a reworded line fails here until she has signed it.
 * Lena translates the six other languages from these; `copy:status` lists them while they hold the English.
 */
const SAGE: Record<string, string> = {
  'pam.name': 'Pam',
  'pam.welcome': "Hi {name}, it's Pam. If you need help with anything, reply here.",
  'pam.welcome.noName': "Hi, it's Pam. If you need help with anything, reply here.",
  'pam.away': "Thanks for writing. Pam is here {hours}, and we'll read your message then.",
  'pam.away.crisis': 'In a crisis, call or text 988.',
  'pam.hours': '{days}, {open} to {close} {zone} time',
  'pam.hours.days.range': '{first} to {last}',
  'pam.hours.days.every': 'Every day',
  'pam.hours.zone.eastern': 'Eastern',
  'messages.pam.placeholder': 'Write to Pam',
  'messages.thread.attach.wrongType.pam.hint': 'Send a photo.',
  'messages.thread.sent': 'Sent',
  'messages.thread.notSent': 'Not sent',
  'messages.thread.tryAgain': 'Try again',
  'messages.thread.notSent.label': 'Not sent. Try again.',
  'messages.thread.sending': 'Sending…',
};

describe("Message Pam's words (Sage's)", () => {
  for (const [key, english] of Object.entries(SAGE)) {
    it(`${key} is as Sage wrote it`, () => {
      expect((EN as Record<string, string>)[key]).toBe(english);
    });
  }
});
