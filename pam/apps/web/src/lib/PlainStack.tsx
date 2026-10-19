'use client';

import * as stylex from '@stylexjs/stylex';
import { MediaTheme } from '@astryxdesign/core/theme';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import type { NoticeToastSpec } from '@pam/ui';

/**
 * The stack's stand-in (D-619): the same place and ground, the title, the line and Contact Pam as a plain link, drawn with nothing to fetch.
 * It is what shows until the toast has loaded, and what stays if it cannot (a page that fails because the phone is offline is the case
 * that matters). It is also the failure banner's plain line when the banner could not be fetched. It is small on purpose: it is in the root
 * bundle.
 */
const styles = stylex.create({
  stack: { width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'auto' },
  card: { boxSizing: 'border-box', width: '100%', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 16px oklch(0 0 0 / 25%)' },
  dark: { backgroundColor: colorVars['--color-background-inverted'] },
  red: { backgroundColor: colorVars['--color-error'], color: colorVars['--color-on-error'] },
  title: { margin: 0, fontSize: '17px', fontWeight: 600, lineHeight: 1.3 },
  body: { margin: 0, marginBlockStart: '4px', fontSize: '16px', lineHeight: 1.4 },
  link: { display: 'inline-flex', alignItems: 'center', minHeight: '48px', color: 'inherit', fontSize: '16px', fontWeight: 600, textDecorationLine: 'underline' },
  banner: { backgroundColor: colorVars['--color-error'], color: colorVars['--color-on-error'], fontSize: '16px', fontWeight: 600, lineHeight: 1.35 },
});

export interface PlainNotice {
  readonly id: string;
  readonly spec: NoticeToastSpec;
}

export function PlainStack({ notices, lostBanner }: { readonly notices: readonly PlainNotice[]; readonly lostBanner: string | null }) {
  return (
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
            {spec.status === 'error' ? inner : <MediaTheme mode="auto" fallback="dark">{inner}</MediaTheme>}
          </div>
        );
      })}
      {lostBanner ? (
        <div role="alert" {...stylex.props(styles.card, styles.banner)}>
          {lostBanner}
        </div>
      ) : null}
    </div>
  );
}
