'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { BigButton, TextField } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/navigate';
import { HelpButton } from './HelpButton';

/**
 * Add a person (D-322, Will, 6 October): somebody who has not used Pam yet,
 * standing at the desk or on the phone. Their first name and number, then
 * the same day-and-time steps as any booking; at the end Pam texts them a
 * link, and the visit is the first thing they see when they sign in.
 *
 * Two fields and nothing else: the person is not here to fill in a form,
 * and the program lead is doing it for them. Everything else is asked of
 * the member later, by Pam, in their own time.
 */
const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  field: { width: '100%' },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

const PROGRAM_PLACE_ID = 'dummy-place-learning';

export function AddPersonView() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const place = DUMMY_PLACES_BY_ID[PROGRAM_PLACE_ID];
  const digits = phone.replace(/[^\d]/g, '');
  const canGo = name.trim().length > 0 && digits.length >= 10;

  return (
    <SubPage
      title={t('book.new.title')}
      backHref="/program/book/"
      backLabel={t('book.new.back')}
      actions={<HelpButton />}
    >
      <Text type="supporting" xstyle={styles.intro}>
        {t('book.new.intro')}
      </Text>
      <Card padding={6}>
        <VStack gap={4}>
          <TextField
            label={t('book.new.name')}
            value={name}
            onChange={setName}
            width="100%"
            xstyle={styles.field}
          />
          <TextField
            purpose="phone"
            label={t('book.new.phone')}
            value={phone}
            onChange={setPhone}
            width="100%"
            xstyle={styles.field}
          />
        </VStack>
      </Card>
      <BigButton
        label={t('book.new.next')}
        isDisabled={!canGo}
        onPress={() =>
          navigate(
            `/trips/new/?${new URLSearchParams({
              place: PROGRAM_PLACE_ID,
              ...(place ? { name: place.name, category: place.category, address: place.address } : {}),
              for: `new-${Date.now()}`,
              forName: name.trim(),
              forPhone: phone.trim(),
            }).toString()}`,
          )
        }
      />
      <Text type="supporting" xstyle={styles.note}>
        {t('book.new.note')}
      </Text>
    </SubPage>
  );
}
