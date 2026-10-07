'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { VStack } from '@astryxdesign/core/VStack';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { markSetupDone, readSentProgram, saveSentProgram } from '@/lib/programSetup';
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
 * **Front end only, for now.** The rules already let a case manager and a
 * program lead write a listing (`services_write_admin` /
 * `services_write_provider`, 0007), so sending one as a `needs_review` row is
 * a follow-up, not a migration. Until it is wired, "Send to Pam" shows what
 * happens next and stores nothing.
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
 * (D-361) — no Back, since a tab has nowhere to go back to.
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
  const wizard = useProgramWizard({
    value: program,
    onChange: setProgram,
    onSubmit: () => {
      setSent(true);
      // Kept for "See what you sent", editing, and an honest wait (D-381).
      saveSentProgram(program);
      markSetupDone('program');
    },
    busy: false,
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
      {...(isTab
        ? { backLabel: '' }
        : isEditing
          ? { backHref: '/program/', backLabel: t('nav.back.program') }
          : { backHref: fromHome ? '/' : '/programs/', backLabel: t(fromHome ? 'nav.back.home' : 'nav.back.programs') })}
      // Back goes one question back while there is one (D-347).
      {...(step > 0 ? { onBack: () => setStep(step - 1) } : {})}
      actions={<HelpButton />}
      // Next stays at the foot of the screen, whatever the question (D-357).
      // As the Program tab it sits above the tab bar, so Next stays in the
      // card there rather than covering the bar (D-361).
      {...(isTab ? {} : { footer: wizard.actions })}
    >
      {/* Straight into the question, on the page — no card, no intro
          (Will, 7 October, D-365). That Pam checks a new program is said
          once, on the last step, where it is about to happen. */}
      <VStack gap={4}>
        {wizard.body}
        {isTab ? wizard.actions : null}
      </VStack>
    </SubPage>
  );
}
