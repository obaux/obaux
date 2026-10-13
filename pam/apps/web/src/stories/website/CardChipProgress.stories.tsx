import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { websiteColors as c } from '../../../../site/src/lib/website-palette';
import { type } from '../../../../site/src/lib/website-type.stylex';

/**
 * The green card's chips switch on their own, with a translucent fill that runs behind the active chip (Will, a77).
 * This is the look for Wren to build: the numbers are in the story's notes and in each state's caption. The real
 * site's colours come from `website-palette.ts`; the card is `surface-brand-deep` in both themes.
 *
 * - **Fill.** The active chip keeps the design's selected look (surface-green, black text in light, white in dark). A
 *   translucent layer runs across it from the start edge to the end over 6s (the hero carousel's `AUTO_MS`), linear.
 *   Light: brand-deep #004033 at 28%. Dark: white at 22%. Text is on top of both layers, so it never changes colour.
 * - **Direction.** From the inline start: left to right in English, right to left in Arabic (`inset-inline-start`).
 * - **Easing.** The fill is `linear`, it is time. The chip that was active lets go over 240ms on (0.2, 0, 0, 1)
 *   (the site's arrive timing).
 * - **Paused.** By the Pause control: the fill stops where it is. By tapping a chip: that chip is selected with the
 *   fill gone (the plain selected look) and the card is paused; Play starts it again from that chip at 0 (after the control, too: Play restarts the chip's 6s).
 * - **Reduced motion.** No fill and no auto-advance, the same as the hero carousel (it hides its Pause control then).
 */
const meta = {
  title: 'Website/Green card chip progress',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

type Theme = 'light' | 'dark';

function ratio(a: string, b: string) {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  };
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const mix = (fg: string, a: number, bg: string) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [f, b] = [p(fg), p(bg)];
  return '#' + f.map((v, i) => Math.round(a * v + (1 - a) * b[i]!).toString(16).padStart(2, '0')).join('');
};

const T = {
  light: { card: c['surface-brand-deep'].light, chip: c['surface-green'].light, text: c['text-primary'].light, onCard: c['text-on-brand-deep'].light, edge: c['border-green'].light, sweep: '#004033', alpha: 0.28 },
  dark: { card: c['surface-brand-deep'].dark, chip: c['surface-green'].dark, text: c['text-primary'].dark, onCard: c['text-on-brand-deep'].dark, edge: c['border-green'].dark, sweep: '#FFFFFF', alpha: 0.22 },
} as const;

const keyframes = stylex.keyframes({ from: { width: '0%' }, to: { width: '100%' } });
const styles = stylex.create({
  card: { borderRadius: '24px', padding: '32px 20px 28px', boxSizing: 'border-box', width: '358px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '12px 8px' },
  chip: { position: 'relative', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', gap: '4px', paddingBlock: '6px', paddingInline: '12px', borderRadius: '15px', borderWidth: '1.3px', borderStyle: 'solid', transitionProperty: 'background-color, color', transitionDuration: '240ms', transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)', cursor: 'pointer', font: 'inherit', background: 'none' },
  fill: { position: 'absolute', insetBlock: 0, insetInlineStart: 0, pointerEvents: 'none' },
  run: { animationName: keyframes, animationDuration: '6000ms', animationTimingFunction: 'linear', animationFillMode: 'forwards' },
  label: { position: 'relative', zIndex: 1 },
  pause: { display: 'inline-flex', alignItems: 'center', gap: '8px', paddingInline: '14px', minHeight: '40px', borderRadius: '24px', borderWidth: '1px', borderStyle: 'solid', cursor: 'pointer', font: 'inherit' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(358px, 1fr))', gap: '24px', alignItems: 'start' },
  cap: { margin: '8px 0 0', fontSize: '13px', lineHeight: '19px', color: '#474747', maxWidth: '358px' },
});

const NAMES = ['Residents', 'Program Providers', 'Case managers'];

function Chip({ theme, label, active, progress, running }: { theme: Theme; label: string; active: boolean; progress: number | 'run' | null; running?: boolean }) {
  const k = T[theme];
  const fill = `${Math.round(k.alpha * 100)}%`;
  return (
    <span
      {...stylex.props(styles.chip, type.label_14)}
      style={{ backgroundColor: active ? k.chip : 'transparent', color: active ? k.text : k.onCard, borderColor: k.edge }}
    >
      {active && progress !== null ? (
        <span
          aria-hidden="true"
          {...stylex.props(styles.fill, progress === 'run' && styles.run)}
          style={{ backgroundColor: `color-mix(in srgb, ${k.sweep} ${fill}, transparent)`, width: progress === 'run' ? undefined : `${progress}%`, animationPlayState: running === false ? 'paused' : 'running' }}
        />
      ) : null}
      <span {...stylex.props(styles.label)}>{label}</span>
      <span aria-hidden="true" {...stylex.props(styles.label)}>↗</span>
    </span>
  );
}

function Card({ theme, active, progress, dir = 'ltr', paused = false, running }: { theme: Theme; active: number; progress: number | 'run' | null; dir?: 'ltr' | 'rtl'; paused?: boolean; running?: boolean }) {
  const k = T[theme];
  return (
    <div dir={dir} {...stylex.props(styles.card)} style={{ backgroundColor: k.card, color: k.onCard }}>
      <div {...stylex.props(type.label_large)} style={{ color: k.onCard }}>Who is Pam for?</div>
      <div {...stylex.props(styles.chips)}>
        {NAMES.map((n, i) => (
          <Chip key={n} theme={theme} label={n} active={i === active} progress={progress} running={running} />
        ))}
      </div>
      <button
        type="button"
        {...stylex.props(styles.pause, type.label_14)}
        style={{ alignSelf: 'flex-end', backgroundColor: theme === 'light' ? c['surface-veil'].light : c['surface-veil'].dark, borderColor: theme === 'light' ? c['border-strong'].light : c['border-strong'].dark, color: theme === 'light' ? '#000' : '#fff' }}
      >
        <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
        {paused ? 'Play' : 'Pause'}
      </button>
    </div>
  );
}

function Spec({ theme }: { theme: Theme }) {
  const k = T[theme];
  const full = mix(k.sweep, k.alpha, k.chip);
  return (
    <p {...stylex.props(styles.cap)}>
      {theme === 'light' ? 'Light' : 'Dark'}: chip {k.chip}, text {k.text}. Fill {k.sweep} at {Math.round(k.alpha * 100)}% (reaches {full}). Text on the plain chip {ratio(k.text, k.chip).toFixed(2)}:1; on the fully filled chip {ratio(k.text, full).toFixed(2)}:1 (AA 4.5 pass). The chip edge {k.edge} on the card {ratio(k.edge, k.card).toFixed(2)}:1.
    </p>
  );
}

/** Every state, both themes: 0%, half, full, paused by the control (stops where it is), paused by a tap (plain selected), and Arabic half-way. */
export const States: Story = {
  render: () => (
    <div {...stylex.props(styles.grid)}>
      {(['light', 'dark'] as const).flatMap((theme) => [
        <div key={`${theme}-0`}><Card theme={theme} active={0} progress={0} /><p {...stylex.props(styles.cap)}>{theme}: the chip becomes active, the fill is at 0%.</p><Spec theme={theme} /></div>,
        <div key={`${theme}-50`}><Card theme={theme} active={1} progress={50} /><p {...stylex.props(styles.cap)}>{theme}: half-way, 3s of 6s.</p></div>,
        <div key={`${theme}-100`}><Card theme={theme} active={1} progress={100} /><p {...stylex.props(styles.cap)}>{theme}: full, the instant before the next chip.</p></div>,
        <div key={`${theme}-pause`}><Card theme={theme} active={2} progress={40} paused /><p {...stylex.props(styles.cap)}>{theme}: paused with the control, the fill stays at 40%; the button says Play.</p></div>,
        <div key={`${theme}-tap`}><Card theme={theme} active={0} progress={null} paused /><p {...stylex.props(styles.cap)}>{theme}: a chip was tapped. It is selected, no fill, the card is paused.</p></div>,
        <div key={`${theme}-ar`}><Card theme={theme} active={1} progress={50} dir="rtl" /><p {...stylex.props(styles.cap)}>{theme}, right to left (Arabic): the fill runs from the right edge.</p></div>,
      ])}
    </div>
  ),
};

/** The real thing, running: 6s a chip, the fill, Pause / Play, a tap pauses. Direction in the controls. */
function Live({ dir, theme }: { dir: 'ltr' | 'rtl'; theme: Theme }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [run, setRun] = useState(0); // Play starts the active chip's 6s again
  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % 3), 6000);
    return () => window.clearTimeout(id);
  }, [active, paused, run]);
  const k = T[theme];
  return (
    <div dir={dir} {...stylex.props(styles.card)} style={{ backgroundColor: k.card, color: k.onCard }}>
      <div {...stylex.props(type.label_large)}>Who is Pam for?</div>
      <div {...stylex.props(styles.chips)}>
        {NAMES.map((n, i) => (
          <span key={n} onClick={() => { setActive(i); setPaused(true); setTapped(true); }}>
            <Chip key={`${n}-${active}-${run}`} theme={theme} label={n} active={i === active} progress={tapped && paused ? null : 'run'} running={!paused} />
          </span>
        ))}
      </div>
      <button type="button" {...stylex.props(styles.pause, type.label_14)} onClick={() => { if (paused) setRun((r) => r + 1); setPaused((p) => !p); setTapped(false); }} style={{ alignSelf: 'flex-end', backgroundColor: theme === 'light' ? c['surface-veil'].light : c['surface-veil'].dark, borderColor: theme === 'light' ? c['border-strong'].light : c['border-strong'].dark, color: theme === 'light' ? '#000' : '#fff' }}>
        <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
        {paused ? 'Play' : 'Pause'}
      </button>
    </div>
  );
}

export const Running: StoryObj<{ dir: 'ltr' | 'rtl'; theme: Theme }> = {
  args: { dir: 'ltr', theme: 'light' },
  argTypes: { dir: { control: 'inline-radio', options: ['ltr', 'rtl'] }, theme: { control: 'inline-radio', options: ['light', 'dark'] } },
  render: (args) => <Live {...args} />,
};
