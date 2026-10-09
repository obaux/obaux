'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@pam/ui/Button';
import { VStack } from '@astryxdesign/core/VStack';
import { useI18n } from '@/lib/i18n';
import { staffRequestPhone } from '@/lib/useStaffRequests';

/**
 * "Text Andre" on a staff request (Will, 4 October, D-262): "a way to message
 * the program lead or case manager … to make sure they coordinate how to use
 * the app." Somebody still waiting has no staff role yet, so Pam's own
 * messages cannot reach them; this opens the super admin's own texting app
 * with their number filled in. The number is read on the tap, not when the
 * list loads — each read is audited (0072), so it is read only when used.
 */
const styles = stylex.create({
  action: { minHeight: '48px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

export function TextRequesterButton({ userId, firstName }: { readonly userId: string; readonly firstName: string | null }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);

  const open = async () => {
    setBusy(true);
    setMissing(false);
    const phone = await staffRequestPhone(userId);
    setBusy(false);
    if (!phone) {
      setMissing(true);
      return;
    }
    // A phone scheme, not a screen: the app has nothing to show for it.
    window.location.assign(`sms:${phone}`);
  };

  return (
    <VStack gap={1}>
      <Button
        label={t('requests.text', { name: firstName ?? t('invite.expired.someone') })}
        variant="secondary"
        onClick={() => void open()}
        isDisabled={busy}
        xstyle={styles.action}
      />
      {missing ? (
        <Text type="supporting" xstyle={styles.note}>
          {t('requests.text.none')}
        </Text>
      ) : null}
    </VStack>
  );
}
