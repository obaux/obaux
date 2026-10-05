'use client';

import { useEffect, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BackArrowIcon } from './icons.js';
import { Page } from './Page.js';

/**
 * The top of every nested screen (D-213) — one template, so a screen you
 * reach by tapping into something always starts the same way: a round back
 * button at the top left, then the screen's name, large. Only what is under
 * it changes. From the reference Will gave on 1 October ("Legal", "Get help").
 *
 * Used by Legal, Language, Get help and its pages, Notifications, a place,
 * Connections, the policies — and, in its `compact` form, a conversation,
 * where the name rides in the bar beside the back button because the screen
 * belongs to the messages, not the title (D-193 still holds).
 *
 * - **Back is a real link**, with an accessible name that says where it goes
 *   ("Back to Profile") — the rule `PageTitle` set (13 September), kept.
 * - **The bar stays** while the page scrolls; once the large title has
 *   scrolled away, the name appears in the bar, as on the tab screens
 *   (`LargeTitleHeader`, D-210). The large title is the page's one `<h1>`;
 *   the bar's copy is for the eye only.
 * - `actions` sit at the right of the bar — a conversation's menu, a place's
 *   share. Most nested screens have none.
 */
export interface SubPageHeaderProps {
  readonly title: string;
  /**
   * Where back goes. Leave out both this and `onBack` only on a step that
   * cannot be undone — the end of joining, once the account exists (D-251).
   */
  readonly backHref?: string;
  /** Where back goes, said — "Back to Profile". */
  readonly backLabel: string;
  /**
   * Back as a step, not a link — a multi-step screen goes to its previous
   * step (Plan a trip, D-235). `backHref` is ignored when this is set.
   */
  readonly onBack?: () => void;
  /** A line under the large title. */
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  /**
   * `large` (the default): back in the bar, the title large beneath it.
   * `compact`: the title in the bar beside back, one row — a conversation.
   */
  readonly variant?: 'large' | 'compact';
  /** Beside a compact title — who the person is to you (a `Token`). */
  readonly titleAddon?: ReactNode;
  /** An id on the `<h1>` — the policies' "Back to top" link targets it. */
  readonly titleId?: string;
}

const COLLAPSE_AT = 48;

const styles = stylex.create({
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    minHeight: '64px',
    marginInline: '-16px',
    paddingInline: '16px',
    marginTop: '-12px',
    backgroundColor: colorVars['--color-background-body'],
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    transitionProperty: 'border-color',
    transitionDuration: '150ms',
  },
  barCollapsed: { borderBottomColor: colorVars['--color-border'] },
  // The reference's back: a soft grey disc, the arrow drawn at 22px.
  back: {
    width: '48px',
    height: '48px',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: colorVars['--color-background-muted'],
    color: colorVars['--color-text-primary'],
  },
  middle: { flexGrow: 1, minWidth: 0 },
  barTitle: {
    fontSize: '18px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: '150ms',
  },
  shown: { opacity: 1 },
  compactTitle: {
    fontSize: '20px',
    lineHeight: 1.2,
    fontWeight: 700,
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  large: { fontSize: '34px', lineHeight: 1.15, fontWeight: 700 },
  subtitle: { fontSize: '17px', lineHeight: 1.4 },
  actions: { flexShrink: 0 },
});

export function SubPageHeader({
  title,
  backHref,
  backLabel,
  subtitle,
  actions,
  variant = 'large',
  titleAddon,
  titleId,
  onBack,
}: SubPageHeaderProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (variant === 'compact') return;
    const onScroll = () => setCollapsed(window.scrollY > COLLAPSE_AT);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  const back = onBack ? (
    <BackButton label={backLabel} onPress={onBack} />
  ) : backHref ? (
    <BackButton href={backHref} label={backLabel} />
  ) : null;

  if (variant === 'compact') {
    return (
      <HStack gap={2} align="center" wrap="nowrap" xstyle={styles.bar}>
        {back}
        <HStack gap={2} align="center" wrap="nowrap" xstyle={styles.middle}>
          <Heading level={1} xstyle={styles.compactTitle}>
            {title}
          </Heading>
          {titleAddon}
        </HStack>
        {actions ? (
          <HStack gap={1} align="center" wrap="nowrap" xstyle={styles.actions}>
            {actions}
          </HStack>
        ) : null}
      </HStack>
    );
  }

  return (
    <>
      <HStack gap={2} align="center" wrap="nowrap" xstyle={[styles.bar, collapsed && styles.barCollapsed]}>
        {back}
        <HStack align="center" wrap="nowrap" xstyle={styles.middle}>
          <Text xstyle={[styles.barTitle, collapsed && styles.shown]} aria-hidden="true">
            {title}
          </Text>
        </HStack>
        {actions ? (
          <HStack gap={1} align="center" wrap="nowrap" xstyle={styles.actions}>
            {actions}
          </HStack>
        ) : null}
      </HStack>
      <VStack gap={1}>
        <Heading level={1} id={titleId} xstyle={styles.large}>
          {title}
        </Heading>
        {subtitle ? (
          <Text type="supporting" xstyle={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </VStack>
    </>
  );
}

const BACK_MARK = { 'data-pam-back': '' } as Record<string, string>;

/**
 * The template's round back button on its own (D-218), for a nested screen
 * whose top is a search bar rather than a title — All programs.
 */
export function BackButton({
  href,
  label,
  onPress,
}: {
  readonly href?: string;
  readonly label: string;
  /** Instead of `href`: back one step on the same screen (D-235). */
  readonly onPress?: () => void;
}) {
  // `data-pam-back` (D-277): with a link, the app's own navigation takes the
  // member back through history to wherever they came from, and uses `href`
  // only when there is nowhere in PAM to go back to.
  return (
    <IconButton
      label={label}
      {...(onPress ? { onClick: onPress } : { href, ...BACK_MARK })}
      variant="ghost"
      icon={
        <HStack>
          <BackArrowIcon width={22} height={22} aria-hidden />
        </HStack>
      }
      xstyle={styles.back}
    />
  );
}

/** A nested screen: the template on top, the screen's own content under it. */
export function SubPage({
  children,
  gap = 4,
  ...header
}: SubPageHeaderProps & { readonly children: ReactNode; readonly gap?: 2 | 3 | 4 }) {
  return (
    <Page gap={gap}>
      <SubPageHeader {...header} />
      {children}
    </Page>
  );
}
