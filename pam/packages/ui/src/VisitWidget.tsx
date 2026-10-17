'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Popover } from '@astryxdesign/core/Popover';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton } from './BigButton.js';
import { Button } from './Button.js';
import { EyeIcon, EyeOffIcon, BackArrowIcon } from './icons.js';
import { textLinkLook } from './TextLink.js';
import { pam } from './tokens.stylex.js';

/**
 * The booked visit as a small widget (Will, card a91, 17 October): the green card of `VisitCard`, with what a member does
 * about the visit inside it, so a place's page is no longer pushed down by a row of buttons.
 *
 * Three views in one card, moved between with the footer:
 *   - **The visit** — the day and time, and a footer of two actions: the check-in one and "Change".
 *   - **Check in** — "I'm here" (the one dark button) and "I went"; their results are said inside the card.
 *   - **Change** — "Change date and time" and "Cancel visit".
 * Each view but the first has a Back to the visit. Once the visit is marked there are no buttons: the card says it is marked.
 *
 * The three views sit in one grid cell, so the card is as tall as the tallest and never changes height when you move
 * between them; a view that is not showing is hidden and inert. Moving fades (none with reduced motion).
 *
 * Top right, one small icon says whether the program is on Pam (an open eye: it sees this visit) or not (a crossed-out eye:
 * it does not); it opens a popover holding the blue note. The word "verified" is not used.
 */
export type VisitWidgetView = 'visit' | 'checkin' | 'change';

export interface VisitWidgetProps {
  /** "Your next visit". */
  readonly eyebrow: string;
  readonly day: string;
  readonly time: string;
  readonly service?: string | null;
  readonly countdown?: string | null;
  /** The program is on Pam: it sees this visit. Picks the icon. */
  readonly programOnPam: boolean;
  /** The icon's name for a screen reader. */
  readonly noteLabel: string;
  /** The blue note the popover holds. */
  readonly note: string;
  readonly closeNoteLabel: string;
  /** Footer, first action: opens the Check in view. */
  readonly checkInLabel: string;
  /** Footer, second action: opens the Change view. */
  readonly changeLabel: string;
  readonly backLabel: string;
  readonly hereLabel: string;
  readonly wentLabel: string;
  readonly changeDateLabel: string;
  readonly cancelVisitLabel: string;
  readonly changeDateHref?: string;
  readonly onHere?: () => void;
  readonly onWent?: () => void;
  readonly onCancelVisit?: () => void;
  /** What the check-in said, inside the card: a Banner. */
  readonly checkInResult?: ReactNode;
  /** The visit is marked: no buttons, this is said instead. */
  readonly isMarked?: boolean;
  readonly markedTitle?: string;
  readonly markedDetail?: string;
  /** For a story: the view it starts in, and whether the note starts open. */
  readonly initialView?: VisitWidgetView;
  readonly isNoteInitiallyOpen?: boolean;
}

const styles = stylex.create({
  card: {
    width: '100%',
    position: 'relative',
    backgroundColor: colorVars['--color-background-green'],
    borderColor: 'transparent',
  },
  // All views in one cell: the card is the tallest view's height and does not change between them.
  stack: { display: 'grid', gridTemplateColumns: '1fr', gridTemplateRows: '1fr' },
  view: {
    gridArea: '1 / 1',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: 0,
    transitionProperty: { default: null, '@media (prefers-reduced-motion: no-preference)': 'opacity' },
    transitionDuration: '160ms',
  },
  hidden: { opacity: 0, visibility: 'hidden', pointerEvents: 'none' },
  shown: { opacity: 1, visibility: 'visible' },
  // The note's icon sits at the card's top right; the first row leaves room for its 48px target.
  note: { position: 'absolute', insetBlockStart: '8px', insetInlineEnd: '8px', color: colorVars['--color-icon-green'] },
  headRoom: { paddingInlineEnd: '44px' },
  mark: {
    width: '40px',
    height: '40px',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: colorVars['--color-background-card'],
    color: colorVars['--color-icon-green'],
  },
  eyebrow: { fontSize: '16px', lineHeight: 1.3, fontWeight: 700, color: colorVars['--color-text-primary'] },
  day: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700, color: colorVars['--color-text-primary'] },
  time: { fontSize: '20px', lineHeight: 1.3, fontWeight: 600, color: colorVars['--color-text-green'] },
  countdown: { fontSize: '16px', lineHeight: 1.3, fontWeight: 400, color: colorVars['--color-text-primary'] },
  grow: { flexGrow: 1 },
  // The footer: a hairline, then two equal actions side by side, each a 48px target, with a hairline between them.
  footer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    marginBlockStart: 'auto',
    marginBlockEnd: '-12px',
    marginInline: '-4px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colorVars['--color-border-green'],
  },
  footerAction: {
    minHeight: pam['--pam-touch-target-min'],
    fontSize: '17px',
    fontWeight: 600,
    color: colorVars['--color-icon-green'],
    borderRadius: 0,
  },
  footerDivider: {
    borderInlineStartWidth: '1px',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: colorVars['--color-border-green'],
  },
  back: { alignSelf: 'flex-start', marginInlineStart: '-8px', minHeight: pam['--pam-touch-target-min'], fontSize: '17px', fontWeight: 600 },
  secondaryLink: { alignSelf: 'center', minHeight: pam['--pam-touch-target-min'], fontSize: '17px', fontWeight: 600 },
  marked: { gap: '4px' },
  popover: { padding: '4px' },
});

const FOOTER_LINK = [textLinkLook.link];

export function VisitWidget(props: VisitWidgetProps) {
  const {
    eyebrow,
    day,
    time,
    service = null,
    countdown = null,
    programOnPam,
    noteLabel,
    note,
    closeNoteLabel,
    checkInLabel,
    changeLabel,
    backLabel,
    hereLabel,
    wentLabel,
    changeDateLabel,
    cancelVisitLabel,
    changeDateHref,
    onHere,
    onWent,
    onCancelVisit,
    checkInResult,
    isMarked = false,
    markedTitle,
    markedDetail,
    initialView = 'visit',
    isNoteInitiallyOpen = false,
  } = props;
  const [view, setView] = useState<VisitWidgetView>(initialView);
  const [noteOpen, setNoteOpen] = useState(isNoteInitiallyOpen);
  const openedFrom = useRef<HTMLElement | null>(null);
  const viewRefs = {
    visit: useRef<HTMLDivElement>(null),
    checkin: useRef<HTMLDivElement>(null),
    change: useRef<HTMLDivElement>(null),
  };

  // Moving between views moves focus with it: into the new view's first control, or back to the footer action that opened it.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (view === 'visit') openedFrom.current?.focus();
    else viewRefs[view].current?.querySelector<HTMLElement>('button, a')?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const go = (next: VisitWidgetView, from?: HTMLElement | null) => {
    if (next !== 'visit' && from) openedFrom.current = from;
    setView(next);
  };

  const shown = (v: VisitWidgetView) => (isMarked ? v === 'visit' : view === v);
  const viewProps = (v: VisitWidgetView) => ({
    ref: viewRefs[v],
    inert: !shown(v),
    'aria-hidden': !shown(v),
    ...stylex.props(styles.view, shown(v) ? styles.shown : styles.hidden),
  });

  return (
    <Card padding={5} xstyle={styles.card}>
      <HStack xstyle={styles.note}>
        <Popover
          placement="below"
          alignment="end"
          width={280}
          label={noteLabel}
          closeButtonLabel={closeNoteLabel}
          isOpen={noteOpen}
          onOpenChange={setNoteOpen}
          content={<Banner status="info" title={note} />}
        >
          <IconButton
            label={noteLabel}
            variant="ghost"
            icon={programOnPam ? <EyeIcon width={22} height={22} aria-hidden /> : <EyeOffIcon width={22} height={22} aria-hidden />}
          />
        </Popover>
      </HStack>
      <div {...stylex.props(styles.stack)}>
        <div {...viewProps('visit')}>
          <HStack gap={3} align="center" wrap="nowrap" xstyle={styles.headRoom}>
            <HStack align="center" justify="center" xstyle={styles.mark}>
              <Icon icon="calendar" size="md" />
            </HStack>
            <Text xstyle={styles.eyebrow}>{eyebrow}</Text>
          </HStack>
          <VStack gap={2}>
            <Text xstyle={styles.day}>{day}</Text>
            <Text xstyle={styles.time}>{service ? `${time} · ${service}` : time}</Text>
            {countdown ? <Text xstyle={styles.countdown}>{countdown}</Text> : null}
          </VStack>
          {isMarked ? (
            <VStack xstyle={styles.marked}>
              <Banner status="success" title={markedTitle ?? ''} {...(markedDetail ? { description: markedDetail } : {})} />
            </VStack>
          ) : (
            <div {...stylex.props(styles.footer)}>
              <Button
                label={checkInLabel}
                variant="ghost"
                onClick={(e) => go('checkin', e.currentTarget as HTMLElement)}
                xstyle={[styles.footerAction, ...FOOTER_LINK]}
              />
              <Button
                label={changeLabel}
                variant="ghost"
                onClick={(e) => go('change', e.currentTarget as HTMLElement)}
                xstyle={[styles.footerAction, styles.footerDivider, ...FOOTER_LINK]}
              />
            </div>
          )}
        </div>

        <div {...viewProps('checkin')}>
          <Button label={backLabel} variant="ghost" icon={<BackArrowIcon width={20} height={20} aria-hidden />} onClick={() => go('visit')} xstyle={[styles.back, textLinkLook.link]} />
          {checkInResult ?? null}
          <VStack gap={3} xstyle={styles.grow}>
            <BigButton label={hereLabel} {...(onHere ? { onPress: onHere } : {})} />
            <Button label={wentLabel} variant="ghost" onClick={onWent} xstyle={[styles.secondaryLink, textLinkLook.link]} />
          </VStack>
        </div>

        <div {...viewProps('change')}>
          <Button label={backLabel} variant="ghost" icon={<BackArrowIcon width={20} height={20} aria-hidden />} onClick={() => go('visit')} xstyle={[styles.back, textLinkLook.link]} />
          <VStack gap={3} xstyle={styles.grow}>
            <BigButton label={changeDateLabel} variant="secondary" {...(changeDateHref ? { href: changeDateHref } : {})} />
            <Button label={cancelVisitLabel} variant="ghost" onClick={onCancelVisit} xstyle={[styles.secondaryLink, textLinkLook.link]} />
          </VStack>
        </div>
      </div>
    </Card>
  );
}
