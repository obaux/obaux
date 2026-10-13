import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { websiteColors as c } from '../../../../site/src/lib/website-palette';
import { type } from '../../../../site/src/lib/website-type.stylex';

/**
 * How the green card changes from one view to the next (Will, a80: "smoother transitions between the slides"). The
 * motion for Wren to build, shown with stand-in pictures (the real ones for the providers and case managers views are
 * on his branch). Slow it down in the controls to see how it is made.
 *
 * - **Picture.** A crossfade of 650ms on (0.4, 0, 0.2, 1) (the app's own scroll ease). The new picture comes in on
 *   top while the old one stays fully there underneath and then goes at the end, so there is never a frame where the
 *   card's green shows through (two pictures each at half opacity would let it). Opacity only; the pictures have the
 *   same white frame in the same place, which stays still: **no scale or drift**, it would make that frame wobble.
 * - **Line.** The old line fades out in 160ms on ease-in (0.4, 0, 1, 1); the new one fades in over 320ms on ease-out
 *   (0, 0, 0.2, 1) starting when the old one has gone, so two lines are never on screen at once. Opacity only.
 * - **Chip.** As now: the colours change over 240ms on (0.2, 0, 0, 1), at once, so the tap is answered first.
 * - **The 6 seconds** are the fill's, unchanged: the change starts when the fill ends.
 * - **Reduced motion:** every one of these is instant (`prefers-reduced-motion`), as the cycle itself does not run.
 */
const meta = {
  title: 'Website/Green card transition',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const DWELL = 6000;
const VIEWS = [
  { name: 'Residents', picture: '/onboarding/hero-city.webp', line: 'Find help, plan your visit, and talk to a real person.' },
  { name: 'Program Providers', picture: '/onboarding/hero-phone.webp', line: 'Your policies, signed before they arrive. Check-in and go!' },
  { name: 'Case managers', picture: '/onboarding/hero-sneakers.webp', line: 'Their plans, your guidance, in one place.' },
];

const styles = stylex.create({
  card: { width: '358px', maxWidth: '100%', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#004033', color: '#FFFFFF' },
  pictures: { position: 'relative', height: '229px' },
  picture: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, zIndex: 1 },
  body: { padding: '32px 20px 48px', display: 'flex', flexDirection: 'column', gap: '20px' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '12px 8px' },
  chip: { paddingBlock: '6px', paddingInline: '12px', borderRadius: '15px', borderWidth: '1.3px', borderStyle: 'solid', cursor: 'pointer', font: 'inherit', background: 'none' },
  lines: { display: 'grid' },
  line: { gridArea: '1 / 1', margin: 0, color: '#FFFFFF', maxWidth: '300px', paddingBlockStart: '12px', fontSize: '20px', fontWeight: 600, lineHeight: '28px', visibility: 'hidden', opacity: 0 },
  controls: { display: 'flex', gap: '12px', alignItems: 'center', marginBlockStart: '16px' },
});

function Card({ active, k }: { active: number; k: number }) {
  // `k` slows the whole thing down (1 = real time, 4 = four times slower).
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ms = (n: number) => (reduce ? '0ms' : `${n * k}ms`);
  return (
    <div {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.pictures)}>
        {VIEWS.map((v, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={v.name}
            src={v.picture}
            alt=""
            {...stylex.props(styles.picture)}
            style={
              i === active
                ? { opacity: 1, zIndex: 2, transition: `opacity ${ms(650)} cubic-bezier(0.4, 0, 0.2, 1)` }
                : { opacity: 0, zIndex: 1, transition: `opacity 0ms linear ${ms(650)}` } // stays, then goes at the end
            }
          />
        ))}
      </div>
      <div {...stylex.props(styles.body)}>
        <div {...stylex.props(type.label_large)}>Who is Pam for?</div>
        <div {...stylex.props(styles.chips)}>
          {VIEWS.map((v, i) => (
            <span
              key={v.name}
              {...stylex.props(styles.chip, type.label_14)}
              style={{
                backgroundColor: i === active ? c['surface-green'].light : 'transparent',
                color: i === active ? c['text-primary'].light : c['text-on-brand-deep'].light,
                borderColor: c['border-green'].light,
                transition: `background-color ${ms(240)} cubic-bezier(0.2, 0, 0, 1), color ${ms(240)} cubic-bezier(0.2, 0, 0, 1)`,
              }}
            >
              {v.name}
            </span>
          ))}
        </div>
        <div {...stylex.props(styles.lines)}>
          {VIEWS.map((v, i) => (
            <h2
              key={v.name}
              {...stylex.props(styles.line)}
              style={
                i === active
                  ? { visibility: 'visible', opacity: 1, transition: `opacity ${ms(320)} cubic-bezier(0, 0, 0.2, 1) ${ms(160)}, visibility 0s linear 0s` }
                  : { visibility: 'hidden', opacity: 0, transition: `opacity ${ms(160)} cubic-bezier(0.4, 0, 1, 1), visibility 0s linear ${ms(160)}` }
              }
            >
              {v.line}
            </h2>
          ))}
        </div>
      </div>
    </div>
  );
}

function Demo({ slow }: { slow: 1 | 4 }) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % VIEWS.length), DWELL);
    return () => window.clearTimeout(id);
  }, [active, auto, slow]);
  return (
    <div>
      <Card active={active} k={slow} />
      <div {...stylex.props(styles.controls)}>
        <button type="button" onClick={() => setActive((a) => (a + 1) % VIEWS.length)}>Next view now</button>
        <label>
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> change every 6s
        </label>
      </div>
    </div>
  );
}

/** Real time. Press "Next view now" to see a change without waiting. */
export const RealTime: StoryObj = { render: () => <Demo slow={1} /> };

/** Four times slower, to see how the picture, the line and the chip are timed against each other. */
export const SlowedFourTimes: StoryObj = { render: () => <Demo slow={4} /> };
