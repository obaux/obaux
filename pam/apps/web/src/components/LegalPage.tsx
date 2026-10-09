'use client';

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
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
import { GuideCard, ReadCard, type Decor } from '@pam/ui/Reading';
import { SubPageHeader } from '@pam/ui/SubPage';
import type { LegalDocument } from '@pam/config';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { goBack } from '@/lib/navigate';
import { READING_STYLE } from '@/lib/readingStyle';

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
  intro: { fontSize: '18px', lineHeight: 1.5 },
  updated: { fontSize: '15px' },
  tocHeading: { fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  // A row of jump chips instead of nine stacked rows (D-416): the first answer
  // is on the first screen, and the row scrolls sideways to the edge of the page.
  toc: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    overflowX: 'auto',
    listStyle: 'none',
    marginBlock: 0,
    marginInline: '-16px',
    paddingInline: '16px',
    paddingBlockEnd: '4px',
    scrollbarWidth: 'none',
    scrollSnapType: 'x proximity',
    // Snap to the padding, not the edge: the first chip keeps its 16px.
    scrollPaddingInline: '16px',
  },
  tocItem: { flexShrink: 0, scrollSnapAlign: 'start' },
  tocLink: {
    display: 'flex',
    alignItems: 'center',
    minHeight: '48px',
    paddingInline: '18px',
    borderRadius: '24px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(127, 127, 127, 0.35)',
    fontSize: '17px',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    color: 'inherit',
    // The reading position, shown as a filled chip rather than a colour change:
    // a colour alone would be the only signal, and one in ten men cannot rely
    // on it. §12 also wants AA contrast, which a tint of the page ground keeps.
    backgroundColor: { default: 'transparent', ':hover': 'rgba(127, 127, 127, 0.12)' },
  },
  tocLinkHere: { backgroundColor: 'rgba(127, 127, 127, 0.18)', fontWeight: 700 },
  section: { width: '100%', scrollMarginBlockStart: '16px' },
  sectionTitle: { fontSize: '21px', lineHeight: 1.3 },
  body: { fontSize: '18px', lineHeight: 1.6 },
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

export function LegalPage({ doc, decor = READING_STYLE }: { doc: LegalDocument; decor?: Decor }) {
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
      if (atBottom) active = ids[ids.length - 1] ?? active;

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

  return (
    <Page width="read">
        {/* The nested-page template (D-213): these open from Legal. */}
        <Suspense fallback={<LegalHeader doc={doc} door={null} />}>
          <LegalHeaderFromUrl doc={doc} />
        </Suspense>
        <Text xstyle={styles.intro}>{t(doc.introKey)}</Text>
        <Text type="supporting" xstyle={styles.updated}>
          {t(doc.updatedKey)}
        </Text>

        {/* Who "your guide" is, said once, before the page says "your guide" (D-416). */}
        {doc.id === 'privacy' ? (
          <GuideCard title={t('guide.title')} body={t('guide.body')} decor={decor} icon={<PeopleIcon />} />
        ) : null}

        <nav aria-label={t('legal.toc')}>
          <VStack gap={1}>
            <Text type="supporting" xstyle={styles.tocHeading}>
              {t('legal.toc')}
            </Text>
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
          </VStack>
        </nav>

        {doc.sections.map((section) => {
          const title = t(section.titleKey);
          const paragraphs = section.bodyKeys.map((key) => t(key));
          return (
            <section key={section.id} id={section.id} {...stylex.props(styles.section)}>
              <ReadCard
                title={title}
                decor={decor}
                icon={SECTION_ICONS[section.id]}
                copy={{
                  // The section, then where it came from, so a pasted line can be traced.
                  text: [title, '', ...paragraphs.flatMap((p) => [p, '']), `Pam — ${t(doc.titleKey)}. ${t(doc.updatedKey)}`].join('\n'),
                  label: t('copy.section'),
                  copiedLabel: t('copy.done'),
                  failedLabel: t('copy.failed'),
                }}
              >
                <VStack gap={2}>
                  {paragraphs.map((text, i) => (
                    <Text key={section.bodyKeys[i]} xstyle={styles.body}>
                      {text}
                    </Text>
                  ))}
                </VStack>
              </ReadCard>
            </section>
          );
        })}

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

function LegalHeader({ doc, door }: { doc: LegalDocument; door: Door }) {
  const { t } = useI18n();
  const fallback = door === 'signin' ? '/signin/' : door === 'join' ? '/join/' : '/legal/';
  return (
    // The nested-page template (D-213).
    <SubPageHeader
      title={t(doc.titleKey)}
      titleId="top"
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

function LegalHeaderFromUrl({ doc }: { doc: LegalDocument }) {
  return <LegalHeader doc={doc} door={useDoor()} />;
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
