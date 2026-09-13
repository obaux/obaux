/**
 * The tempo. One place, so two screens cannot disagree about what "quick" is —
 * and a plain module with no dependencies, so reading it never drags the
 * animation library into a bundle.
 *
 *   - **Under a quarter second.** 180–260ms. Long enough to read as movement,
 *     short enough that a second tap never queues behind it.
 *   - **Opacity and transform only.** The two properties a phone animates on
 *     the compositor. Animating height or colour on a four-year-old Android is
 *     where "premium" turns into a stutter.
 */
export const PAM_MOTION = {
  /** A tap acknowledging itself. */
  press: { duration: 0.12 },
  /** A thing arriving: a screen, a card, a row. */
  enter: { duration: 0.24, ease: [0.2, 0, 0, 1] as const },
  /** A thing leaving. Slightly faster than arriving — waiting on an exit is dead time. */
  exit: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
} as const;
