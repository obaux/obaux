'use client';

import * as stylex from '@stylexjs/stylex';
import { colorVars, fontWeightVars, radiusVars, spacingVars, textSizeVars } from '@astryxdesign/core/theme/tokens.stylex';
import type { NoticeToastSpec } from '@pam/ui/noticeSink';

/**
 * The stack's stand-in (D-619): the same place and ground, the title, the line and Contact Pam as a plain link, drawn with nothing to fetch.
 * It is what shows until the toast has loaded, and what stays if it cannot (a page that fails because the phone is offline is the case
 * that matters). It is also the failure banner's plain line when the banner could not be fetched. It is small on purpose: it is in the root
 * bundle.
 */
const styles = stylex.create({
  // The stand-in has no measuring (the tab bar, the keyboard): it sits at the bottom edge until the stack has loaded.
  host: { position: 'fixed', insetInline: 0, insetBlockEnd: `calc(${spacingVars['--spacing-3']} + env(safe-area-inset-bottom, 0px))`, zIndex: 60, display: 'flex', justifyContent: 'center', paddingInline: spacingVars['--spacing-4'], pointerEvents: 'none' },
  stack: { width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: spacingVars['--spacing-2'], pointerEvents: 'auto' },
  card: { boxSizing: 'border-box', width: '100%', padding: spacingVars['--spacing-4'], borderRadius: radiusVars['--radius-container'] },
  // The dark card: the inverse of the page, so its words are the page's own colour (light on dark, and dark on light in dark mode).
  dark: { backgroundColor: colorVars['--color-background-inverted'], color: colorVars['--color-background-body'] },
  red: { backgroundColor: colorVars['--color-error'], color: colorVars['--color-on-error'] },
  title: { margin: 0, fontSize: textSizeVars['--font-size-lg'], fontWeight: fontWeightVars['--font-weight-semibold'] },
  // 16px is Pam's reading size (A23); Astryx has no token for it (its base is 14px, its next step 17px).
  body: { margin: 0, fontSize: '16px' },
  link: { display: 'inline-flex', alignItems: 'center', minHeight: spacingVars['--spacing-12'], color: 'inherit', fontWeight: fontWeightVars['--font-weight-semibold'], textDecorationLine: 'underline' },
});

export interface PlainNotice {
  readonly id: string;
  readonly spec: NoticeToastSpec;
}

export function PlainStack({ notices, lostBanner }: { readonly notices: readonly PlainNotice[]; readonly lostBanner: string | null }) {
  return (
    <div {...stylex.props(styles.host)}>
    <div {...stylex.props(styles.stack)}>
      {notices.map(({ id, spec }) => {
        const inner = (
          <>
            <p {...stylex.props(styles.title)}>{spec.title}</p>
            {spec.body ? <p {...stylex.props(styles.body)}>{spec.body}</p> : null}
            {spec.contact ? (
              <a href={spec.contact.href} {...stylex.props(styles.link)}>
                {spec.contact.label}
              </a>
            ) : null}
          </>
        );
        return (
          <div
            key={id}
            role={spec.status === 'info' ? 'status' : 'alert'}
            {...stylex.props(styles.card, spec.status === 'error' ? styles.red : styles.dark)}
          >
            {inner}
          </div>
        );
      })}
      {lostBanner ? (
        <div role="alert" {...stylex.props(styles.card, styles.red)}>
          <p {...stylex.props(styles.title)}>{lostBanner}</p>
        </div>
      ) : null}
    </div>
    </div>
  );
}
