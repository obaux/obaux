'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { AppHeader, BigButton, Notice } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { setReminderConsent } from '@/lib/useReminderConsent';

/**
 * Do you want PAM to text you about the things you plan?
 *
 * Its own screen, for two reasons that point the same way.
 *
 * **For the person.** Sign-in is one job — get in — and a screen that also asks
 * somebody to weigh up a messaging policy is a screen doing two things (§2.5).
 * The people who mostly need reminders are members, and this is shown to them
 * right after their first sign-in; a case manager signing in to look at their
 * caseload does not meet it at all, because nothing about their day depends on
 * being texted a reminder.
 *
 * **For the carrier.** A2P registration wants active, unambiguous consent: an
 * unticked box, a clear statement of what is sent and how often, STOP and HELP,
 * and rates. All of that fits here without turning the front door into a
 * contract, and this screen is the screenshot that goes with the registration.
 *
 * Either button is an answer. "Not now" writes the same row with false, so
 * nobody is asked twice and a decision is never inferred from silence.
 *
 * **No help link here, deliberately** (Will, 13 September) — the one exception
 * to §0's "every screen has a visible way to get help". This screen asks one
 * question with two answers, both one tap away, and neither can fail in a way
 * calling PAM would fix. A third button next to them makes the question look
 * harder than it is, and the screen a member is sent to right after their first
 * sign-in is the wrong place to imply they might need rescuing. Help is one tap
 * away everywhere they land next, and the signed-out state below still carries
 * the support number.
 */

const styles = stylex.create({
  page: { maxWidth: '520px', marginInline: 'auto', paddingInline: '16px', paddingBlock: '28px' },
  title: { fontSize: '28px', lineHeight: 1.2 },
  intro: { fontSize: '18px', lineHeight: 1.5 },
  card: { width: '100%' },
  heading: { fontSize: '17px' },
  item: { fontSize: '17px', lineHeight: 1.45 },
  small: { fontSize: '15px', lineHeight: 1.5 },
  box: { width: '100%', minHeight: '48px', textAlign: 'start' },
  link: { minHeight: '48px', fontSize: '17px' },
});

export default function RemindersPage() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const [wants, setWants] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  // A second visit should show what was chosen last time, not an empty box.
  useEffect(() => {
    if (session.status !== 'signed-in') return;
    let cancelled = false;
    void (async () => {
      const { getReminderConsent } = await import('@/lib/useReminderConsent');
      const current = await getReminderConsent(session.session.userId);
      if (!cancelled && current !== null) setWants(current);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const answer = async (value: boolean) => {
    if (session.status !== 'signed-in') return;
    setBusy(true);
    setFailed(false);
    const saved = await setReminderConsent(session.session.userId, value);
    setBusy(false);
    if (saved) setDone(true);
    else setFailed(true);
  };

  return (
    <main {...stylex.props(styles.page)}>
      <VStack gap={4}>
        <AppHeader />

        <VStack gap={2}>
          <Heading level={1} xstyle={styles.title}>
            {t('reminders.title')}
          </Heading>
          <Text xstyle={styles.intro}>{t('reminders.intro')}</Text>
        </VStack>

        <Card padding={4} xstyle={styles.card}>
          <VStack gap={2}>
            <Text xstyle={styles.heading}>{t('reminders.what')}</Text>
            <Text xstyle={styles.item}>{t('reminders.what.1')}</Text>
            <Text xstyle={styles.item}>{t('reminders.what.2')}</Text>
            <Text xstyle={styles.item}>{t('reminders.what.3')}</Text>
            <Text type="supporting" xstyle={styles.small}>
              {t('reminders.how')}
            </Text>
          </VStack>
        </Card>

        {/*
          Unticked, always. A2P 10DLC 30925 is the rule and the reason is the
          same one PAM would give anyway: a box somebody did not tick is not an
          answer they gave.
        */}
        <CheckboxInput
          label={t('reminders.optIn')}
          value={wants}
          onChange={(checked) => setWants(checked)}
          xstyle={styles.box}
        />

        {done ? (
          <Text type="supporting" xstyle={styles.small}>
            {t('reminders.saved')}
          </Text>
        ) : null}

        {failed ? (
          <Notice
            notice="something_went_wrong"
            title={t('notice.something_went_wrong.title')}
            body={t('notice.something_went_wrong.body')}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
        ) : null}

        {/*
          Signed out, the choice is still shown — it is what somebody is being
          asked, and hiding it behind a sign-in explains nothing — but the thing
          to do next is sign in, so that is the button.
        */}
        {session.status === 'signed-in' ? (
          <>
            {/*
              The button is the consent, and it says so.
              Will: people will miss a checkbox. They will — a tick box is a
              thing to notice beside a button, which is a thing to press, and
              the one that looks like the way forward wins. So the primary
              action carries the agreement in its own words, and pressing it
              ticks the box as well, so what somebody sees afterwards matches
              what was recorded.
              This is stronger consent than a box, not weaker: the words being
              agreed to are on the control that was pressed. The box stays for
              anybody who reads a screen that way, and it still starts empty.
            */}
            <BigButton
              label={t('reminders.agree')}
              onPress={() => {
                setWants(true);
                void answer(true);
              }}
              isDisabled={busy}
            />
            {/* Saying no is one tap, and it is recorded like any other answer. */}
            <Button
              label={t('reminders.skip')}
              variant="ghost"
              onClick={() => void answer(false)}
              isDisabled={busy}
              xstyle={styles.link}
            />
          </>
        ) : session.status === 'loading' ? null : (
          <>
            <Text type="supporting" xstyle={styles.small}>
              {t('reminders.signedOut')}
            </Text>
            <BigButton label={t('signin.title')} href="/signin/" />
          </>
        )}

      </VStack>
    </main>
  );
}
