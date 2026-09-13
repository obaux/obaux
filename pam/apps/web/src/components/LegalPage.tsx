'use client';

import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { AppHeader } from '@pam/ui';
import type { LegalDocument } from '@pam/config';
import { useI18n } from '@/lib/i18n';

/**
 * A long page somebody can actually find their way around.
 *
 * These two pages are read in two very different moods: somebody deciding
 * whether to trust PAM with a phone number, and somebody who wants one answer
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
  page: { maxWidth: '720px', marginInline: 'auto', paddingInline: '16px', paddingBlock: '24px' },
  title: { fontSize: '28px', lineHeight: 1.2 },
  intro: { fontSize: '18px', lineHeight: 1.5 },
  updated: { fontSize: '15px' },
  tocHeading: { fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  toc: { width: '100%', paddingInline: 0, marginBlock: 0, listStyle: 'none' },
  tocItem: { marginBlock: '2px' },
  tocLink: {
    display: 'flex',
    alignItems: 'center',
    minHeight: '48px',
    paddingInline: '12px',
    borderRadius: '8px',
    fontSize: '17px',
    lineHeight: 1.3,
    textAlign: 'start',
    textDecoration: 'none',
    color: 'inherit',
    // The reading position, shown as a filled row rather than a colour change:
    // a colour alone would be the only signal, and one in ten men cannot rely
    // on it. §12 also wants AA contrast, which a tint of the page ground keeps.
    backgroundColor: { default: 'transparent', ':hover': 'rgba(127, 127, 127, 0.12)' },
  },
  tocLinkHere: { backgroundColor: 'rgba(127, 127, 127, 0.18)', fontWeight: 700 },
  section: { width: '100%', scrollMarginBlockStart: '16px' },
  sectionTitle: { fontSize: '21px', lineHeight: 1.3 },
  body: { fontSize: '18px', lineHeight: 1.6 },
  footerLink: { minHeight: '48px', fontSize: '17px' },
});

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
    <main {...stylex.props(styles.page)}>
      <VStack gap={4}>
        <AppHeader />

        <Heading level={1} id="top" xstyle={styles.title}>
          {t(doc.titleKey)}
        </Heading>
        <Text xstyle={styles.intro}>{t(doc.introKey)}</Text>
        <Text type="supporting" xstyle={styles.updated}>
          {t(doc.updatedKey)}
        </Text>

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

        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} {...stylex.props(styles.section)}>
            <VStack gap={2}>
              <Heading level={2} xstyle={styles.sectionTitle}>
                {t(section.titleKey)}
              </Heading>
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
          <Button
            label={t('legal.backToTop')}
            variant="ghost"
            href="#top"
            xstyle={styles.footerLink}
          />
          <Button
            label={doc.id === 'privacy' ? t('legal.terms') : t('legal.privacy')}
            variant="ghost"
            href={doc.id === 'privacy' ? '/terms/' : '/privacy/'}
            xstyle={styles.footerLink}
          />
          <Button
            label={t('help.title')}
            variant="ghost"
            href="/help/"
            xstyle={styles.footerLink}
          />
        </VStack>
      </VStack>
    </main>
  );
}
