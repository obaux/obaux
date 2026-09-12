import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';

/**
 * "Need help? Call PAM" (§2.4).
 *
 * §0: "Never dead-end. Every screen has a visible way back and a visible
 * 'Get help'." This is that guarantee, so it is a plain `tel:` anchor pinned to
 * the bottom of the viewport: it works with no JavaScript, no network, and no
 * successful sign-in. If a member is lost enough to need it, the app is the
 * last thing that should have to be working.
 */
export interface HelpBarProps {
  /** PAM's support line in E.164. */
  supportPhone: string;
  /** Localised, e.g. "Need help? Call PAM". */
  label: string;
}

const styles = stylex.create({
  bar: {
    position: 'fixed',
    insetInline: 0,
    bottom: 0,
    zIndex: 50,
    display: 'flex',
    justifyContent: 'center',
    // Clears the home indicator on iOS and gesture bars on Android.
    paddingBlock: '8px',
    paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
    paddingInline: '16px',
    backgroundColor: 'var(--astryx-color-surface, rgba(255,255,255,0.96))',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'var(--astryx-color-border, rgba(0,0,0,0.12))',
    backdropFilter: 'blur(8px)',
  },
  button: { minHeight: '48px', width: '100%', maxWidth: '480px', fontSize: '17px' },
});

export function HelpBar({ supportPhone, label }: HelpBarProps) {
  return (
    <div {...stylex.props(styles.bar)}>
      <Button
        label={label}
        variant="secondary"
        href={`tel:${supportPhone}`}
        xstyle={styles.button}
      />
    </div>
  );
}
