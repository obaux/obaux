'use client';

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@pam/ui/Button';
import {
  AwardIcon,
  BookIcon,
  ClockIcon,
  EyeIcon,
  FlagIcon,
  InfoIcon,
  MeIcon,
  MessagesIcon,
  Page,
  PeopleIcon,
  PhoneIcon,
  PlacesIcon,
  SettingsIcon,
  ShareIcon,
  ShieldIcon,
  TextLink,
} from '@pam/ui';
import { CopyButton } from '@pam/ui/CopyButton';
import { GuideCard, SectionHeading } from '@pam/ui/Reading';
import { SubPageHeader } from '@pam/ui/SubPage';
import type { LegalDocument } from '@pam/config';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { goBack } from '@/lib/navigate';

/**
 * A long page somebody can actually find their way around.
 *
 * These two pages are read in two very different moods: somebody deciding
 * whether to trust Pam with a phone number, and somebody who wants one answer
 * now ("can my officer read my messages?"). The contents list serves the second
 * one — it is the whole reason this is not a wall of text — and the highlight
 * that follows the reading position keeps the answer to "where am I" visible
 * without anybody having to think about it.
 *
 * Built on an IntersectionObserver rather than a scroll handler: the work
 * happens off the main thread, which matters on the low-end Android in §12.
 * Where it is unavailable the list still works — every item is a real anchor —
 * it simply does not highlight, which is the right thing to lose.
 */

const styles = stylex.create({
  // 16px: the body size (SOP A23), the line under the title.
  intro: { fontSize: '16px', lineHeight: 1.5 },
  updated: { fontSize: '15px' },
  // The jump row follows Explore's tabs (Will, 9 October, D-417): white 40px
  // pills with a soft lift, the one you are on outlined dark. The 48px a finger
  // needs (§2.5) is an invisible margin round each pill (::before), as there.
  // It starts in line with the page and runs to the screen's right edge.
  toc: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    overflowX: 'auto',
    listStyle: 'none',
    marginBlock: 0,
    marginInlineStart: '-4px',
    marginInlineEnd: '-16px',
    paddingInlineStart: '4px',
    paddingInlineEnd: '16px',
    paddingBlock: '6px 10px',
    scrollbarWidth: 'none',
    scrollSnapType: 'x proximity',
    scrollPaddingInline: '4px',
  },
  tocItem: { flexShrink: 0, scrollSnapAlign: 'start' },
  tocLink: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minHeight: '40px',
    paddingInline: '14px',
    borderRadius: '999px',
    fontSize: '15px',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    color: colorVars['--color-text-primary'],
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    boxShadow: '0 1px 4px light-dark(oklch(0 0 0 / 7%), oklch(0 0 0 / 35%))',
    '::before': { content: "''", position: 'absolute', insetBlock: '-4px', insetInline: '-2px' },
  },
  // The reading position, drawn as a heavier outline and weight rather than a
  // colour change: a colour alone would be the only signal (§12).
  tocLinkHere: { borderWidth: '2px', borderColor: colorVars['--color-text-primary'], fontWeight: 600 },
  // 24px more above each section on top of the page's own gap (Will, D-419: "more
  // gap between sections"), so a new heading starts a clear block.
  //
  // **scroll-margin: 136px** (Will, 10 October: "tabs to jump to text need offset so header isn't covering
  // title"): a tapped tab scrolls its section to just under the two bars that stay on screen, the header bar
  // (64px) and the tab row (56px: 6 above, the 40px pill, 10 below), and 16px of air. At the old 16px the
  // section heading landed under the header.
  section: { width: '100%', scrollMarginBlockStart: '136px', marginBlockStart: '24px' },
  // 16px more between the guide card and the tabs (Will, D-419). The tabs stay on screen (Will, 10 October:
  // "tabs sticky on top for easy navigation"): stuck at 64px, directly under the header bar (`SubPage`'s `bar`,
  // 64px, z-index 5), in the page's colour so the text scrolling under them does not show through, and out
  // to the screen's edges as the bar is.
  tocWrap: {
    marginBlockStart: '16px',
    position: 'sticky',
    top: '64px',
    zIndex: 4,
    marginInline: '-16px',
    paddingInline: '16px',
    backgroundColor: colorVars['--color-background-body'],
  },
  // 16px, the body size (SOP A23), with a comfortable 1.6 line height (Will, D-419).
  body: { fontSize: '16px', lineHeight: 1.6 },
});

/** The small icon on each card, in the "icons" look (D-416). */
const SECTION_ICONS: Record<string, ReactNode> = {
  'what-we-keep': <BookIcon />,
  'who-can-see': <EyeIcon />,
  limits: <FlagIcon />,
  texts: <MessagesIcon />,
  'never-say': <ShieldIcon />,
  sharing: <ShareIcon />,
  'how-long': <ClockIcon />,
  'your-choices': <SettingsIcon />,
  contact: <PhoneIcon />,
  'what-pam-is': <InfoIcon />,
  emergencies: <PhoneIcon />,
  'your-account': <MeIcon />,
  'being-decent': <PeopleIcon />,
  programs: <PlacesIcon />,
  points: <AwardIcon />,
  changes: <ClockIcon />,
};

export function LegalPage({ doc }: { doc: LegalDocument }) {
  const { t } = useI18n();
  const [here, setHere] = useState<string | null>(doc.sections[0]?.id ?? null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const ids = doc.sections.map((s) => s.id);

    /**
     * The section being read is the last one whose heading has passed the
     * middle of the screen. Measured rather than inferred from which elements
     * are intersecting: a short section fully on screen and a long one filling
     * it produce very different intersection ratios while a reader would call
     * both "here", and picking by ratio makes the highlight jump backwards on
     * the long ones.
     */
    const recompute = () => {
      // Halfway down, not near the top: a short section at the foot of the
      // page can never push its heading into the top third — the page runs out
      // of scroll first — and the mark would stick on the section above it.
      const line = window.innerHeight * 0.5;
      let active = ids[0] ?? null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) active = id;
      }

      // The last section is short and sits at the foot of the page, so it can
      // never reach that line — the page runs out of scroll first. At the
      // bottom, the last section is what you are reading, whatever the maths
      // says.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
      // Or the end of the text is on screen: on a short phone the last section
      // can be wholly in view, under the two bars, without the page being at its
      // very bottom or the section's heading being above the middle line.
      const endShown = (endRef.current?.getBoundingClientRect().top ?? Infinity) <= window.innerHeight;
      if (atBottom || endShown) active = ids[ids.length - 1] ?? active;

      setHere(active);
    };

    // Recomputed on scroll, coalesced to one measurement per frame, so a
    // fast flick does not queue up dozens of them. An IntersectionObserver
    // alone was not enough: it reports crossings, and scrolling within one long
    // section crosses nothing, which left the mark behind on exactly the pages
    // where somebody is hunting for a specific answer.
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        recompute();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Still worth observing: this is what catches the page settling after
    // images, fonts or a jump-to-anchor, without a timer.
    const observer = new IntersectionObserver(onScroll, { threshold: [0, 0.5, 1] });
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    if (endRef.current) observer.observe(endRef.current);

    recompute();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [doc]);

  // One copy icon, top right of the page, for the whole document (Will, D-417):
  // the title, when it was updated, who "your guide" is, every section, and where
  // it came from, so a pasted line can be traced.
  const pageText = [
    t(doc.titleKey),
    t(doc.updatedKey),
    '',
    t(doc.introKey),
    ...(doc.id === 'privacy' ? ['', `${t('guide.title')}: ${t('guide.body')}`] : []),
    ...doc.sections.flatMap((section) => ['', t(section.titleKey), ...section.bodyKeys.map((key) => t(key))]),
    '',
    `Pam — ${t(doc.titleKey)}`,
  ].join('\n');
  const copyAction = (
    <CopyButton
      text={pageText}
      label={t('copy.page')}
      copiedLabel={t('copy.done')}
      failedLabel={t('copy.failed')}
    />
  );

  return (
    <Page width="read">
        {/* The nested-page template (D-213): these open from Legal. */}
        <Suspense fallback={<LegalHeader doc={doc} door={null} actions={copyAction} />}>
          <LegalHeaderFromUrl doc={doc} actions={copyAction} />
        </Suspense>
        <Text xstyle={styles.intro}>{t(doc.introKey)}</Text>
        <Text type="supporting" xstyle={styles.updated}>
          {t(doc.updatedKey)}
        </Text>

        {/* Who "your guide" is, said once, before the page says "your guide" (D-416). */}
        {doc.id === 'privacy' ? (
          <GuideCard title={t('guide.title')} body={t('guide.body')} icon={<PeopleIcon />} />
        ) : null}

        <nav aria-label={t('legal.toc')} {...stylex.props(styles.tocWrap)}>
          <ul {...stylex.props(styles.toc)}>
            {doc.sections.map((section) => {
              const isHere = section.id === here;
              return (
                <li key={section.id} {...stylex.props(styles.tocItem)}>
                  <a
                    href={`#${section.id}`}
                    // Tells a screen reader what the highlight is saying to
                    // everybody else: this is the part you are reading.
                    aria-current={isHere ? 'true' : undefined}
                    {...stylex.props(styles.tocLink, isHere && styles.tocLinkHere)}
                  >
                    {t(section.titleKey)}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Flat sections, no cards (Will, D-417): an icon beside each heading, then the words. */}
        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} {...stylex.props(styles.section)}>
            {/* 16px between paragraphs (Will, D-419: "more space between paragraphs"). */}
            <VStack gap={4}>
              <SectionHeading title={t(section.titleKey)} icon={SECTION_ICONS[section.id]} />
              {section.bodyKeys.map((key) => (
                <Text key={key} xstyle={styles.body}>
                  {t(key)}
                </Text>
              ))}
            </VStack>
          </section>
        ))}

        <div ref={endRef} aria-hidden="true" />

        {/* Never dead-end (§0): back up the page, a way on, and a way to a person. */}
        <VStack gap={1}>
          <TextLink label={t('legal.backToTop')} href="#top" />
          <Suspense fallback={<OtherDocument doc={doc} door={null} />}>
            <OtherDocumentFromUrl doc={doc} />
          </Suspense>
          <TextLink label={t('help.title')} href="/help/" />
        </VStack>
    </Page>
  );
}

/**
 * Where a legal page was opened from (Will, 3 October, D-250). From Sign in
 * or from joining, Back returns there — to the screen as it was left, the
 * number still typed — not to Legal: somebody who is not in yet has no Legal
 * to go back to. Read from `?from=`, so the page itself stays static.
 */
type Door = 'signin' | 'join' | null;

function useDoor(): Door {
  const from = useSearchParams()?.get('from');
  return from === 'signin' || from === 'join' ? from : null;
}

function LegalHeader({ doc, door, actions }: { doc: LegalDocument; door: Door; actions?: ReactNode }) {
  const { t } = useI18n();
  const fallback = door === 'signin' ? '/signin/' : door === 'join' ? '/join/' : '/legal/';
  return (
    // The nested-page template (D-213).
    <SubPageHeader
      title={t(doc.titleKey)}
      titleId="top"
      {...(actions ? { actions } : {})}
      backHref={fallback}
      backLabel={
        door === 'signin'
          ? t('nav.back.signInScreen')
          : door === 'join'
            ? t('nav.back.joinScreen')
            : t('nav.back.legal')
      }
      {...(door ? { onBack: () => goBack(fallback) } : {})}
    />
  );
}

function LegalHeaderFromUrl({ doc, actions }: { doc: LegalDocument; actions?: ReactNode }) {
  return <LegalHeader doc={doc} door={useDoor()} actions={actions} />;
}

/** The other document, keeping where this one was opened from. */
function OtherDocument({ doc, door }: { doc: LegalDocument; door: Door }) {
  const { t } = useI18n();
  const href = doc.id === 'privacy' ? '/terms/' : '/privacy/';
  return (
    <TextLink
      label={doc.id === 'privacy' ? t('legal.terms') : t('legal.privacy')}
      href={door ? `${href}?from=${door}` : href}
    />
  );
}

function OtherDocumentFromUrl({ doc }: { doc: LegalDocument }) {
  return <OtherDocument doc={doc} door={useDoor()} />;
}
