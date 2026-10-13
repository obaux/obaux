import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { type } from '../../../../site/src/lib/website-type.stylex';
import { websiteColors } from '../../../../site/src/lib/website-palette';

/**
 * Two website text colours, side by side, for Will to choose (card a65). Phone width, light theme, the site's real type
 * styles on the site's real surfaces. Nothing here changes the site: the tokens stay as they are until Will decides.
 * Ratios are worked out live from the palette (WCAG 2.x), AA for text is 4.5:1.
 */
const meta = {
  title: 'Website/Text colours (Will to choose)',
  parameters: { layout: 'padded', viewport: { defaultViewport: 'mobile1' } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function lin(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
function ratio(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const styles = stylex.create({
  page: { width: '390px', maxWidth: '100%', boxSizing: 'border-box', fontFamily: 'Figtree, system-ui, sans-serif' },
  h: { margin: '24px 0 4px', fontSize: '18px', fontWeight: 700 },
  note: { margin: '0 0 12px', fontSize: '14px', lineHeight: 1.4, color: '#474747' },
  pair: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  card: { borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  title: { margin: 0, color: '#000' },
  body: { margin: 0, color: '#000' },
  tag: { fontSize: '13px', fontWeight: 700, color: '#000', margin: '6px 0 0' },
  result: { fontSize: '14px', fontWeight: 700, margin: 0 },
  row: { display: 'flex', alignItems: 'center', gap: '8px', minHeight: '48px' },
});

const COPY = {
  eyebrow: 'Before you start',
  body: 'You can change who sees your name any time in Settings.',
};

function Verdict({ fg, bg }: { fg: string; bg: string }) {
  const r = ratio(fg, bg);
  const pass = r >= 4.5;
  return (
    <p {...stylex.props(styles.result)} style={{ color: pass ? '#087A18' : '#B3261E' }}>
      {fg} · {r.toFixed(2)}:1 · {pass ? 'AA pass' : 'AA fail'}
    </p>
  );
}

function Callout({ fg, bg }: { fg: string; bg: string }) {
  return (
    <div>
      <div {...stylex.props(styles.card)} style={{ backgroundColor: bg }}>
        <span {...stylex.props(type.eyebrow_13)} style={{ color: fg, textTransform: 'uppercase' }}>{COPY.eyebrow}</span>
        <p {...stylex.props(type.body_15, styles.body)} style={{ color: fg }}>{COPY.body}</p>
      </div>
      <Verdict fg={fg} bg={bg} />
    </div>
  );
}

const GREY = [
  ['Muted card', websiteColors['surface-muted'].light],
  ['Gray', websiteColors['surface-gray'].light],
  ['Green', websiteColors['surface-green'].light],
  ['Purple', websiteColors['surface-purple'].light],
] as const;

function Grey() {
  return (
    <div {...stylex.props(styles.page)}>
      <h2 {...stylex.props(styles.h)}>Grey text on tinted cards</h2>
      <p {...stylex.props(styles.note)}>Top card in each pair is Will’s #666666. Bottom card is the site’s #595959.</p>
      {GREY.map(([name, bg]) => (
        <div key={name} {...stylex.props(styles.pair)}>
          <p {...stylex.props(styles.tag)}>{name} ({bg})</p>
          <Callout fg="#666666" bg={bg} />
          <Callout fg="#595959" bg={bg} />
        </div>
      ))}
    </div>
  );
}

/** Grey text on the tinted cards: Will's #666666 against the site's #595959. Each card shows the callout label and a row body. */
export const GreyOnTintedCards: Story = { render: () => <Grey /> };

function GreenRow({ fg }: { fg: string }) {
  const bg = websiteColors['surface-page'].light;
  return (
    <div>
      <div {...stylex.props(styles.card)} style={{ backgroundColor: bg, border: '1px solid #D4D4D4' }}>
        <span {...stylex.props(type.eyebrow_13)} style={{ color: fg, textTransform: 'uppercase' }}>Message sent</span>
        <div {...stylex.props(styles.row)}>
          <span {...stylex.props(type.label_14)} style={{ color: fg, textDecoration: 'underline' }}>View your reply</span>
        </div>
        <p {...stylex.props(type.body_15, styles.body)}>Your case manager will see it today.</p>
      </div>
      <Verdict fg={fg} bg={bg} />
    </div>
  );
}

function Green() {
  return (
    <div {...stylex.props(styles.page)}>
      <h2 {...stylex.props(styles.h)}>Green text on white</h2>
      <p {...stylex.props(styles.note)}>Top is Will’s #0B991F. Bottom is the site’s #087A18. Icons and strokes stay #0B991F either way.</p>
      <GreenRow fg="#0B991F" />
      <GreenRow fg="#087A18" />
    </div>
  );
}

/** Green text on white: Will’s #0B991F against the site’s #087A18. A label and a link, as the site draws them. */
export const GreenOnWhite: Story = { render: () => <Green /> };

/** Both comparisons on one page, for sending as a single link. */
export const Both: Story = {
  render: () => (
    <>
      <Grey />
      <Green />
    </>
  ),
};
