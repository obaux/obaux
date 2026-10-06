'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Text } from '@astryxdesign/core/Text';
import { PlacesIcon } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import type { ProgramDetails } from '@/lib/useJoin';
import { ProgramDetailsStep } from '../app/join/ProgramDetailsStep';
import { HelpButton } from './HelpButton';

/**
 * Add a program (D-218, Will, 2 October: "both case managers and programs be
 * able to add new program"). Reached from the + on All programs.
 *
 * The same fields a program lead fills in at sign-up (`ProgramDetailsStep`,
 * 0056), so a new program has one shape however it arrives; only the name is
 * required, and Pam checks every new program before it is listed (the
 * `needs_review` gate every manual entry goes through).
 *
 * **Front end only, for now.** The rules already let a case manager and a
 * program lead write a listing (`services_write_admin` /
 * `services_write_provider`, 0007), so sending one as a `needs_review` row is
 * a follow-up, not a migration. Until it is wired, "Send to Pam" shows what
 * happens next and stores nothing.
 */
const EMPTY: ProgramDetails = {
  name: '',
  category: '',
  subcategory: '',
  description: '',
  address: '',
  phone: '',
  website: '',
};

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  card: { width: '100%' },
  state: { paddingBlock: '32px' },
  stateIcon: { width: '64px', height: '64px' },
});

export function AddProgramView() {
  const { t } = useI18n();
  const [program, setProgram] = useState<ProgramDetails>(EMPTY);
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const invalid = tried && program.name.trim() === '';

  return (
    <SubPage
      title={t('programs.new.title')}
      backHref="/programs/"
      backLabel={t('nav.back.programs')}
      actions={<HelpButton />}
    >
      {sent ? (
        <EmptyState
          headingLevel={2}
          xstyle={styles.state}
          icon={<PlacesIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
          title={t('programs.new.done.title')}
          description={t('programs.new.done.body')}
          actions={
            <Button
              label={t('programs.new.another')}
              variant="secondary"
              onClick={() => {
                setProgram(EMPTY);
                setTried(false);
                setSent(false);
              }}
            />
          }
        />
      ) : (
        <>
          <Text type="supporting" xstyle={styles.intro}>
            {t('programs.new.intro')}
          </Text>
          <Card padding={6} xstyle={styles.card}>
            <ProgramDetailsStep
              value={program}
              onChange={setProgram}
              onSubmit={() => {
                setTried(true);
                if (program.name.trim() !== '') setSent(true);
              }}
              busy={false}
              invalid={invalid}
              submitLabel={t('programs.new.send')}
            />
          </Card>
        </>
      )}
    </SubPage>
  );
}
