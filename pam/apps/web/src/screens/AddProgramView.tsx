'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { VStack } from '@astryxdesign/core/VStack';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { markSetupDone, readSentProgram, saveSentProgram } from '@/lib/programSetup';
import { asksForOwnProgram, submitOwnProgram } from '@/lib/useOwnProgram';
import { useSession } from '@/lib/useSession';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { Notice } from '@pam/ui';
import type { ProgramDetails } from '@/lib/useJoin';
import { PROGRAM_STEPS, useProgramWizard } from '../app/join/ProgramWizard';
import { HelpButton } from './HelpButton';
import { ProgramReviewView } from './ProgramReviewView';

/**
 * Add a program (D-218, Will, 2 October: "both case managers and programs be
 * able to add new program"). Reached from the + on All programs.
 *
 * The program questions (`ProgramWizard`, one question a screen since D-347; no longer asked at sign-up, D-353;
 * 0056), so a new program has one shape however it arrives; only the name is
 * required, and Pam checks every new program before it is listed (the
 * `needs_review` gate every manual entry goes through).
 *
 * **A program lead's send is real (D-447).** "Send to Pam" calls
 * `submit_program`: their organisation is made if they have none and the
 * listing is written waiting for review, so it is on file whatever phone they
 * open Pam on next. A demo or story account, and a case manager adding a
 * program for someone else, still only see what happens next.
 *
 * From Home's getting-started card (`?from=home`, D-352) Back goes Home, and
 * sending it takes that card off Home. Sent, it becomes "Sent to Pam"
 * (`ProgramReviewView`, D-379), which is also the Program tab until approval.
 */
const EMPTY: ProgramDetails = {
  name: '',
  category: '',
  subcategory: '',
  description: '',
  address: '',
  phone: '',
  website: '',
  services: [],
};

/**
 * `isTab`: drawn as the Program tab itself, for a lead with no program yet
 * (D-361). It covers the bottom bar like any page you tap into, so Back
 * from the first question goes Home and Next is pinned to the foot (D-383).
 */
export function AddProgramView({ isTab = false }: { readonly isTab?: boolean } = {}) {
  const { t } = useI18n();
  const params = useSearchParams();
  const fromHome = params?.get('from') === 'home';
  // Editing after Pam asked for changes (D-381): what was sent, at the review.
  const isEditing = params?.get('edit') === '1';
  const [program, setProgram] = useState<ProgramDetails>(() => (isEditing ? readSentProgram()?.details : null) ?? EMPTY);
  const [step, setStep] = useState(() => (isEditing ? PROGRAM_STEPS.length - 1 : 0));
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const { state: session } = useSession();
  const supportPhone = useSupportPhone();
  // A signed-in program lead, not a demo account: their send is saved for real.
  const isReal = asksForOwnProgram(session) !== null;
  const wizard = useProgramWizard({
    value: program,
    onChange: setProgram,
    onSubmit: async () => {
      if (isReal) {
        setBusy(true);
        setFailed(false);
        const ok = await submitOwnProgram(program);
        setBusy(false);
        // Not on file: stay on the last question with what was typed, and say so.
        if (!ok) {
          setFailed(true);
          return;
        }
      }
      setSent(true);
      // Kept for "See what you sent", editing, and an honest wait (D-381).
      saveSentProgram(program);
      markSetupDone('program');
    },
    busy,
    submitLabel: t('programs.new.send'),
    step,
    onStep: setStep,
  });

  // Sent: the celebration, and what happens next (D-379).
  if (sent) return <ProgramReviewView isCelebrating />;

  return (
    <SubPage
      // The last step is its own page by name (Will, 7 October, D-367).
      title={t(PROGRAM_STEPS[step] === 'review' ? 'programs.new.review.title' : 'programs.new.title')}
      {...(isTab || fromHome
        ? { backHref: '/', backLabel: t('nav.back.home'), isBackFixed: isTab }
        : isEditing
          ? { backHref: '/program/', backLabel: t('nav.back.program') }
          : { backHref: '/programs/', backLabel: t('nav.back.programs') })}
      // Back goes one question back while there is one (D-347).
      {...(step > 0 ? { onBack: () => setStep(step - 1) } : {})}
      actions={<HelpButton />}
      // Next stays at the foot of the screen, whatever the question (D-357);
      // as the Program tab too, now that it covers the bar (D-383).
      footer={wizard.actions}
    >
      {/* Straight into the question, on the page — no card, no intro
          (Will, 7 October, D-365). That Pam checks a new program is said
          once, on the last step, where it is about to happen. */}
      <VStack gap={4}>
        {failed ? (
          <Notice
            notice="something_went_wrong"
            title={t('join.failed.title')}
            body={t('join.failed.body')}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
        ) : null}
        {wizard.body}
      </VStack>
    </SubPage>
  );
}
