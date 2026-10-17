'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Popover } from '@astryxdesign/core/Popover';
import { BigButton } from './BigButton.js';
import { EyeIcon, EyeOffIcon, BackArrowIcon } from './icons.js';
import { Button } from './Button.js';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { pam } from './tokens.stylex.js';
import { textLinkLook } from './TextLink.js';

/**
 * The booked visit, at the top of a place opened from it (Will, 5 October,
 * D-281). It used to be one green row — the day and "10:00 AM · Visit
 * booked" — and that was not enough to say three things at once: that this
 * is *your next visit*, when it is, and that you can move it. So it is a
 * small hero: the label, the day large, the time, and under them a link to
 * change it.
 *
 * Green, like the trip card's confirmed token (D-273), so it reads as done.
 * The card itself is not a link — only "Change appointment" is.
 *
 * Also the booked screen's card (Will, 7 October, D-337: "use the Green card
 * for confirmed booking allowing for changing booking from confirmation
 * screen. Bring in the number of days piece into that card"): there the
 * eyebrow is the program's name, and `countdown` says how soon.
 */
export interface VisitCardProps {
  /** "Your next visit". */
  readonly eyebrow: string;
  /** "Wednesday, October 7". */
  readonly day: string;
  /** "10:00 AM". */
  readonly time: string;
  /** The service the visit is for, after the time: "10:00 AM · GED classes" (D-332). */
  readonly service?: string | null;
  /** How soon, under the time: "Today", "Tomorrow", "In 2 days" (D-337). */
  readonly countdown?: string | null;
  /** "Change appointment" — left out for a visit that has already happened. */
  readonly changeLabel?: string;
  readonly changeHref?: string | null;
}

const styles = stylex.create({
  card: {
    width: '100%',
    backgroundColor: colorVars['--color-background-green'],
    borderColor: 'transparent',
  },
  mark: {
    width: '40px',
    height: '40px',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: colorVars['--color-background-card'],
    color: colorVars['--color-icon-green'],
  },
  // The program's name in the body colour, not green (Will, D-343), so it
  // reads as a name rather than another green label.
  eyebrow: { fontSize: '16px', lineHeight: 1.3, fontWeight: 700, color: colorVars['--color-text-primary'] },
  day: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700, color: colorVars['--color-text-primary'] },
  time: { fontSize: '20px', lineHeight: 1.3, fontWeight: 600, color: colorVars['--color-text-green'] },
  // Metadata, so it reads quieter than the day and time (Will, D-341): plain
  // weight, smaller, in the body colour. Not the secondary grey — on the
  // dark-mode green that is 4.08:1, under AA's 4.5.
  countdown: { fontSize: '16px', lineHeight: 1.3, fontWeight: 400, color: colorVars['--color-text-primary'] },
  rule: {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colorVars['--color-border-green'],
    // With the change link's -13px below, its words sit 20px under this line
    // and 20px above the card's edge, measured to the ink (Will, D-342).
    paddingBlockStart: '2px',
  },
  change: {
    alignSelf: 'flex-start',
    // The 48px target hangs into the card's bottom padding, so the words sit
    // as far from the bottom edge as from the left (Will, D-341: "bottom
    // padding is stronger than right"); it was 33px under, 18px beside.
    marginBlockEnd: '-13px',
    minHeight: pam['--pam-touch-target-min'],
    fontSize: '17px',
    fontWeight: 600,
  },
  chevron: { fontSize: '1.3em', lineHeight: 0, fontWeight: 'inherit', color: 'inherit', textDecorationLine: 'inherit' },
  changeColour: {
    color: { default: colorVars['--color-icon-green'], ':hover': colorVars['--color-text-green'] },
  },
});

export function VisitCard({ eyebrow, day, time, service = null, countdown = null, changeLabel, changeHref = null }: VisitCardProps) {
  return (
    <Card padding={5} xstyle={styles.card}>
      {/* Room between each line (Will, 7 October, D-339: "so things aren't
          squished together"). */}
      <VStack gap={5}>
        <HStack gap={3} align="center" wrap="nowrap">
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
        {changeLabel && changeHref ? (
          <VStack xstyle={styles.rule}>
            <Button
              label={changeLabel}
              variant="ghost"
              href={changeHref}
              // A link, not a pill (D-280).
              xstyle={[styles.change, textLinkLook.link, styles.changeColour]}
            >
              {/*
                A chevron after the words (Will, D-343). A character of the
                same font rather than an icon, so it takes the link's weight
                and its underline runs on under it; the label stays the
                accessible name, the chevron is hidden from screen readers.
              */}
              {changeLabel}
              <Text aria-hidden xstyle={styles.chevron}>
                {'\u00A0\u203A'}
              </Text>
            </Button>
          </VStack>
        ) : null}
      </VStack>
    </Card>
  );
}

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
  /** The program has someone on Pam, so it sees this visit (an open eye); otherwise a crossed-out eye. */
  readonly hasLead: boolean;
  /** The icon's name for a screen reader. */
  readonly noteLabel: string;
  /** The blue note the popover holds. */
  readonly note: string;
  readonly closeNoteLabel: string;
  /** Footer, first action: opens the Check in view. One prop, so the word is one line to change. */
  readonly checkInLabel: string;
  /** Whether the first action shows: false outside the window where a visit can be marked, and "Change" is then alone. */
  readonly showsCheckIn?: boolean;
  /** Footer, second action: opens the Change view. */
  readonly changeLabel: string;
  readonly backLabel: string;
  readonly hereLabel: string;
  readonly wentLabel: string;
  readonly changeDateLabel: string;
  readonly cancelVisitLabel: string;
  readonly changeDateHref?: string;
  readonly onChangeDate?: () => void;
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

const widgetStyles = stylex.create({
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
  footerSingle: { gridTemplateColumns: '1fr' },
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
    hasLead,
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
    onChangeDate,
    showsCheckIn = true,
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

  // Escape goes back to the visit from Check in or Change.
  useEffect(() => {
    if (view === 'visit') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setView('visit');
    };
    const root = viewRefs[view].current;
    root?.addEventListener('keydown', onKey);
    return () => root?.removeEventListener('keydown', onKey);
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
    ...stylex.props(widgetStyles.view, shown(v) ? widgetStyles.shown : widgetStyles.hidden),
  });

  return (
    <Card padding={5} xstyle={widgetStyles.card}>
      <HStack xstyle={widgetStyles.note}>
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
            icon={hasLead ? <EyeIcon width={22} height={22} aria-hidden /> : <EyeOffIcon width={22} height={22} aria-hidden />}
          />
        </Popover>
      </HStack>
      <div {...stylex.props(widgetStyles.stack)}>
        <div {...viewProps('visit')}>
          <HStack gap={3} align="center" wrap="nowrap" xstyle={widgetStyles.headRoom}>
            <HStack align="center" justify="center" xstyle={widgetStyles.mark}>
              <Icon icon="calendar" size="md" />
            </HStack>
            <Text xstyle={widgetStyles.eyebrow}>{eyebrow}</Text>
          </HStack>
          <VStack gap={2}>
            <Text xstyle={widgetStyles.day}>{day}</Text>
            <Text xstyle={widgetStyles.time}>{service ? `${time} · ${service}` : time}</Text>
            {countdown ? <Text xstyle={widgetStyles.countdown}>{countdown}</Text> : null}
          </VStack>
          {isMarked ? (
            <VStack xstyle={widgetStyles.marked}>
              <Banner status="success" title={markedTitle ?? ''} {...(markedDetail ? { description: markedDetail } : {})} />
            </VStack>
          ) : (
            <div {...stylex.props(widgetStyles.footer, !showsCheckIn && widgetStyles.footerSingle)}>
              {showsCheckIn ? (
                <Button
                  label={checkInLabel}
                  variant="ghost"
                  onClick={(e) => go('checkin', e.currentTarget as HTMLElement)}
                  xstyle={[widgetStyles.footerAction, ...FOOTER_LINK]}
                />
              ) : null}
              <Button
                label={changeLabel}
                variant="ghost"
                onClick={(e) => go('change', e.currentTarget as HTMLElement)}
                xstyle={[widgetStyles.footerAction, showsCheckIn && widgetStyles.footerDivider, ...FOOTER_LINK]}
              />
            </div>
          )}
        </div>

        <div {...viewProps('checkin')}>
          <Button label={backLabel} variant="ghost" icon={<BackArrowIcon width={20} height={20} aria-hidden />} onClick={() => go('visit')} xstyle={[widgetStyles.back, textLinkLook.link]} />
          <div aria-live="polite">{checkInResult ?? null}</div>
          <VStack gap={3} xstyle={widgetStyles.grow}>
            <BigButton label={hereLabel} {...(onHere ? { onPress: onHere } : {})} />
            <Button label={wentLabel} variant="ghost" onClick={onWent} xstyle={[widgetStyles.secondaryLink, textLinkLook.link]} />
          </VStack>
        </div>

        <div {...viewProps('change')}>
          <Button label={backLabel} variant="ghost" icon={<BackArrowIcon width={20} height={20} aria-hidden />} onClick={() => go('visit')} xstyle={[widgetStyles.back, textLinkLook.link]} />
          <VStack gap={3} xstyle={widgetStyles.grow}>
            <BigButton label={changeDateLabel} variant="secondary" {...(changeDateHref ? { href: changeDateHref } : {})} {...(onChangeDate ? { onPress: onChangeDate } : {})} />
            <Button label={cancelVisitLabel} variant="ghost" onClick={onCancelVisit} xstyle={[widgetStyles.secondaryLink, textLinkLook.link]} />
          </VStack>
        </div>
      </div>
    </Card>
  );
}
