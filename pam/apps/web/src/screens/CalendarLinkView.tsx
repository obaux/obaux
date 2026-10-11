'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, Notice, TextLink } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { appleUrl, feedUrl, useCalendarLink } from '@/lib/useCalendarLink';
import { ConfirmDialog } from './ConfirmDialog';
import { HelpButton } from './HelpButton';

/**
 * Calendar (D-538): a secret address that puts a member's Pam visits in the calendar app they
 * already use. Said before anything else: anyone who can see their calendar will see these visits.
 * Discreet by default (each event says only "Pam visit"); one switch shows the place's name and
 * address, and changing it needs no new address. The address is shown once — Pam keeps only a hash
 * of it — so the page says so, and "Make a new link" is how to get one again.
 */
const styles = stylex.create({
  body: { fontSize: '17px', lineHeight: 1.5 },
  small: { fontSize: '15px', lineHeight: 1.5 },
  label: { fontSize: '17px', lineHeight: 1.4 },
  words: { flexGrow: 1, minWidth: 0 },
  link: { fontSize: '16px', lineHeight: 1.4, overflowWrap: 'anywhere', wordBreak: 'break-all', userSelect: 'all' },
  actions: { rowGap: '12px' },
});

export function CalendarLinkView() {
  const { t, tPlain } = useI18n();
  const { state: session } = useSession();
  const signedIn = session.status === 'signed-in';
  const { state, busy, failed, make, setShowDetails, turnOff } = useCalendarLink(signedIn);
  const [asking, setAsking] = useState<'new' | 'off' | null>(null);
  const [copied, setCopied] = useState(false);

  const token = state.status === 'on' ? state.token : null;
  const copy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(feedUrl(token));
      setCopied(true);
    } catch {
      // The address is on screen and selectable; copying by hand still works.
    }
  };

  return (
    <SubPage title={t('calendar.title')} backHref="/profile/" backLabel={tPlain('nav.back.profile')} actions={<HelpButton />}>
      <Text xstyle={styles.body}>{t('calendar.intro')}</Text>
      <Text type="supporting" xstyle={styles.body}>
        {t('calendar.warn')}
      </Text>

      {state.status === 'error' || failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('notice.something_went_wrong.title')}
          body={t('notice.something_went_wrong.body')}
          contactLabel={t('help.contact.action')}
        />
      ) : null}

      {state.status === 'off' ? <BigButton label={t(busy ? 'calendar.making' : 'calendar.make')} isDisabled={busy} onPress={() => void make()} /> : null}

      {state.status === 'on' ? (
        <>
          <Card padding={6}>
            <VStack gap={3}>
              <Text xstyle={styles.label}>{t('calendar.link.label')}</Text>
              {token ? (
                <>
                  <Text xstyle={styles.link}>{feedUrl(token)}</Text>
                  <Text type="supporting" xstyle={styles.small}>
                    {t('calendar.once')}
                  </Text>
                  <VStack gap={2} xstyle={styles.actions}>
                    <Button label={t(copied ? 'calendar.copied' : 'calendar.copy')} variant="secondary" onClick={() => void copy()} />
                    <Button label={t('calendar.apple')} variant="secondary" href={appleUrl(token)} />
                  </VStack>
                  <Text type="supporting" xstyle={styles.small}>
                    {t('calendar.others')}
                  </Text>
                  <Text type="supporting" xstyle={styles.small}>
                    {t('calendar.slow')}
                  </Text>
                </>
              ) : (
                <Text type="supporting" xstyle={styles.small}>
                  {t('calendar.lostLink')}
                </Text>
              )}
              <Text type="supporting" xstyle={styles.small}>
                {t('calendar.secret')}
              </Text>
            </VStack>
          </Card>

          <Card padding={6}>
            <HStack gap={3} align="center" wrap="nowrap">
              <VStack gap={1} xstyle={styles.words}>
                <Text xstyle={styles.label}>{t('calendar.details')}</Text>
                <Text type="supporting" xstyle={styles.small}>
                  {t('calendar.details.hint')}
                </Text>
              </VStack>
              <Switch label={t('calendar.details')} isLabelHidden value={state.showDetails} changeAction={(on) => void setShowDetails(on)} />
            </HStack>
          </Card>

          <VStack gap={3}>
            <TextLink label={t('calendar.new')} onClick={() => setAsking('new')} />
            <TextLink label={t('calendar.off')} onClick={() => setAsking('off')} />
          </VStack>
        </>
      ) : null}

      <ConfirmDialog
        isOpen={asking === 'new'}
        title={t('calendar.new.title')}
        body={t('calendar.new.body')}
        confirmLabel={t('calendar.new.confirm')}
        onConfirm={() => {
          setAsking(null);
          setCopied(false);
          void make();
        }}
        cancelLabel={t('calendar.new.keep')}
        onCancel={() => setAsking(null)}
      />
      <ConfirmDialog
        isOpen={asking === 'off'}
        title={t('calendar.off.title')}
        body={t('calendar.off.body')}
        confirmLabel={t('calendar.off.confirm')}
        onConfirm={() => {
          setAsking(null);
          void turnOff();
        }}
        cancelLabel={t('calendar.off.keep')}
        onCancel={() => setAsking(null)}
      />
    </SubPage>
  );
}
