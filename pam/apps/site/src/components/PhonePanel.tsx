import * as stylex from '@stylexjs/stylex';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';

/*
 * The picture slot of a feature row: a soft panel with a phone screen set into it, cut off at the bottom, as in the
 * design. Raw elements are used for the layering (the site has a few; see PostScreen). The screen is a real Pam
 * screen from Storybook with example people (`scripts/screenshots.mjs`, `screenshots.json`), at 390 and 780px wide.
 * `bubble` is an optional floating line of example chat over the corner; it is decoration (`aria-hidden`), the
 * screen's words are in `alt`.
 */
const styles = stylex.create({
  panel: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    height: '400px',
    boxSizing: 'border-box',
    borderRadius: '40px',
    backgroundColor: website['--website-surface-muted'],
  },
  phone: {
    position: 'absolute',
    insetBlockStart: '43px',
    insetInlineStart: '50%',
    transform: 'translateX(-50%)',
    width: '286px',
    height: 'auto',
    display: 'block',
    borderRadius: '43px',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: website['--website-border-strong'],
    backgroundColor: website['--website-surface-page'],
  },
  bubble: {
    position: 'absolute',
    insetBlockEnd: '56px',
    insetInlineEnd: '28px',
    maxWidth: '200px',
    paddingBlock: '6px',
    paddingInline: '12px',
    borderRadius: '14px',
    backgroundColor: website['--website-surface-green'],
    color: website['--website-text-primary'],
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
  },
});

export function PhonePanel({
  name,
  alt,
  bubble,
  eager = false,
}: {
  /** `explore`, `calendar` or `conversation`: files `/home/<name>-390.webp` and `-780.webp`. */
  readonly name: string;
  readonly alt: string;
  readonly bubble?: string;
  readonly eager?: boolean;
}) {
  return (
    <div {...stylex.props(styles.panel)}>
      <img
        src={`/home/${name}-780.webp`}
        srcSet={`/home/${name}-390.webp 390w, /home/${name}-780.webp 780w`}
        sizes="286px"
        width={390}
        height={844}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        {...stylex.props(styles.phone)}
      />
      {bubble ? (
        <div aria-hidden="true" {...stylex.props(styles.bubble, type.label_14)}>
          {bubble}
        </div>
      ) : null}
    </div>
  );
}
