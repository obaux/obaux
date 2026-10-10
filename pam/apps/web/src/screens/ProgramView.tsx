'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@pam/ui/Button';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { categoryLabelKey, type Category, displayPhone } from '@pam/config';
import { DUMMY_SAVED_BY_ROLE } from '@pam/config/dummy-places';
import { BookIcon, GlobeIcon, Loading, Notice, Page, PhoneIcon, PlaceDetail, PlacesIcon, PlusIcon, TextField, TextLink, googlePlaceHref } from '@pam/ui';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { MenuList } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';
import { addressActionsFor } from '@/lib/addressActions';
import { useSession } from '@/lib/useSession';
import { useProgramSetup } from '@/lib/programSetup';
import { saveOwnProgram, withdrawSubmission } from '@/lib/useOwnProgram';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { AddProgramView } from './AddProgramView';
import { ProgramReviewView } from './ProgramReviewView';
import { usePolicies } from '@/lib/usePolicies';
import { useServices } from '@/lib/useServices';
import { BigCategoryIcon } from './SavedView';

/**
 * Program — a program lead's own listing, their second tab (D-218, Will,
 * 2 October): "similar to the place's profile screen, but showing their
 * program, with a top-right button to edit — only edit."
 *
 * Reading, it is the page a member sees for the program (`PlaceDetail`),
 * without a member's save, share or report — those are a member's, not the
 * program's. Edit, top right and alone, turns the same details into fields;
 * the button becomes Save, with Cancel under the form.
 *
 * **A real program writes back; the example does not.** A lead's own program
 * is read from the database and saved to it (`onSave`, D-447); the example
 * program (a demo account, a story) keeps its edits for the visit only.
 * Once a program is live (`isLive`), its description, phone and website are the
 * lead's to change at once, but a new name or address is asked of Pam (D-447):
 * it waits beside the live one (`pending`), members keep seeing what they saw,
 * and the lead can take it back (`onCancelPending`).
 */
export interface ProgramDetailsData {
  readonly name: string;
  readonly category: Category;
  readonly description: string;
  readonly address: string;
  readonly phone: string;
  readonly website: string;
}

const QUICK = { width: 24, height: 24, 'aria-hidden': true } as const;
const ROW = { width: 26, height: 26, 'aria-hidden': true } as const;
/** The example program's place (D-218) until a lead's own listing is loaded. */
const PROGRAM_PLACE_ID = 'dummy-place-learning';

const styles = stylex.create({
  edit: {
    minHeight: '48px',
    borderRadius: '999px',
    paddingInline: '20px',
    fontSize: '17px',
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  field: { width: '100%' },
  heading: { fontSize: '18px', fontWeight: 600, lineHeight: 1.3 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  saved: { fontSize: '16px', lineHeight: 1.5 },
  servicesHint: { fontSize: '15px', lineHeight: 1.5 },
  empty: { fontSize: '16px', lineHeight: 1.5 },
});

export function ProgramView({
  program: initial,
  note,
  programId = PROGRAM_PLACE_ID,
  isLive = false,
  pending = null,
  onCancelPending,
  onSave,
  canSwitch = false,
}: {
  readonly program: ProgramDetailsData;
  readonly note?: string | null;
  /** The program's id: its services are read for it (a real program's, or the example's). */
  readonly programId?: string;
  /** A live program: a new name or address is asked of Pam, not written (D-447). */
  readonly isLive?: boolean;
  /** A change to the name or address waiting for Pam (D-462). */
  readonly pending?: { readonly name: string | null; readonly address: string | null } | null;
  /** Take the waiting change back; resolves false when it could not be. */
  readonly onCancelPending?: () => Promise<boolean>;
  /** A real program: write the edit; resolves false when it could not be saved. */
  readonly onSave?: (draft: ProgramDetailsData) => Promise<boolean>;
  /** A real lead's program: the way to their other programs, and to add one (D-318). */
  readonly canSwitch?: boolean;
}) {
  const { t } = useI18n();
  const [program, setProgram] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // What was asked of Pam, said once after saving (D-447).
  const [askedPam, setAskedPam] = useState(false);
  const supportPhone = useSupportPhone();
  const set = (patch: Partial<ProgramDetailsData>) => setDraft((d) => ({ ...d, ...patch }));
  const { policies } = usePolicies();
  const { forPlace } = useServices();
  const services = forPlace(programId);

  // The services (D-313), as rows: reading, each opens its editor; editing,
  // "Add a service" joins them on top. One list, so a lead learns one place.
  const serviceRows = services.map((s) => ({
    id: s.id,
    label: s.name,
    description: s.description || undefined,
    isDescriptionOneLine: true,
    icon: <BigCategoryIcon category={program.category} size={ROW} />,
    href: `/program/service/?id=${encodeURIComponent(s.id)}`,
  }));
  const servicesCard = (
    <Card padding={6}>
      <VStack gap={3}>
        <VStack gap={1}>
          <Text xstyle={styles.heading}>{t('program.services.label')}</Text>
          <Text type="supporting" xstyle={styles.servicesHint}>
            {t('program.services.hint')}
          </Text>
        </VStack>
        {services.length === 0 && !editing ? (
          <Text type="supporting" xstyle={styles.empty}>
            {t('program.services.empty')}
          </Text>
        ) : null}
        <MenuList
          label={t('program.services')}
          hasDividers
          isInset
          items={[
            ...(editing
              ? [
                  {
                    id: 'add',
                    label: t('program.services.add'),
                    description: t('program.services.add.body'),
                    icon: <PlusIcon {...ROW} />,
                    href: '/program/service/',
                  },
                ]
              : []),
            ...serviceRows,
          ]}
        />
      </VStack>
    </Card>
  );

  const save = async () => {
    if (draft.name.trim() === '' || isSaving) return;
    const next = { ...draft, name: draft.name.trim() };
    if (onSave) {
      setIsSaving(true);
      const ok = await onSave(next);
      setIsSaving(false);
      // Not saved: stay in the form with what was typed, and say so.
      if (!ok) {
        setFailed(true);
        return;
      }
    }
    setFailed(false);
    // A live program's new name or address waits for Pam: the page keeps the
    // ones members see (D-447).
    const asks = isLive && (next.name !== program.name || next.address.trim() !== program.address.trim());
    setAskedPam(asks);
    setProgram(asks ? { ...next, name: program.name, address: program.address } : next);
    setEditing(false);
    setSaved(true);
  };

  return (
    <Page gap={4}>
      <LargeTitleHeader
        title={program.name}
        actions={
          <Button
            label={editing ? t('program.save') : t('program.edit')}
            variant="ghost"
            isDisabled={isSaving}
            onClick={() => {
              if (editing) {
                void save();
                return;
              }
              // The number as people read it, not as the database keeps it.
              setDraft({ ...program, phone: displayPhone(program.phone) });
              setSaved(false);
              setFailed(false);
              setEditing(true);
            }}
            xstyle={styles.edit}
          />
        }
      />

      {canSwitch && !editing ? (
        <MenuList
          label={t('program.switch.title')}
          items={[
            {
              id: 'switch',
              label: t('program.switch.row'),
              description: t('program.switch.row.body'),
              href: '/program/switch/',
              icon: <PlacesIcon width={26} height={26} aria-hidden />,
            },
          ]}
        />
      ) : null}

      {saved ? <Text xstyle={styles.saved}>{t(askedPam ? 'program.saved.change' : 'program.saved')}</Text> : null}
      {pending ? (
        <Banner
          status="info"
          title={t('program.pending.title')}
          description={[t('program.pending.body'), pending.name, pending.address].filter(Boolean).join(' · ')}
          {...(onCancelPending
            ? {
                endContent: (
                  <Button label={t('program.pending.cancel')} variant="ghost" onClick={() => void onCancelPending()} />
                ),
              }
            : {})}
        />
      ) : null}
      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('join.failed.title')}
          body={t('join.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {editing ? (
        <Card padding={6}>
          <VStack gap={3}>
            <TextField
              label={t('program.name')}
              // Ready to type on arrival (Will, 7 October, D-365).
              hasAutoFocus
              value={draft.name}
              onChange={(next) => set({ name: next })}
              width="100%"
              xstyle={styles.field}
            />
            <TextArea
              label={t('join.program.description')}
              value={draft.description}
              onChange={(next) => set({ description: next })}
              rows={3}
              width="100%"
            />
            <TextField
              purpose="address"
              label={t('join.program.address')}
              value={draft.address}
              onChange={(next) => set({ address: next })}
              width="100%"
              xstyle={styles.field}
            />
            <TextField
              purpose="phone"
              label={t('join.program.phone')}
              value={draft.phone}
              onChange={(next) => set({ phone: next })}
              width="100%"
              xstyle={styles.field}
            />
            <TextField
              label={t('join.program.website')}
              value={draft.website}
              onChange={(next) => set({ website: next })}
              width="100%"
              xstyle={styles.field}
            />
            {isLive ? (
              <Text type="supporting" xstyle={styles.note}>
                {t('program.locked')}
              </Text>
            ) : null}
            <TextLink label={t('program.cancel')} onClick={() => setEditing(false)} />
          </VStack>
        </Card>
      ) : null}
      {editing ? servicesCard : null}
      {editing ? null : (
        <PlaceDetail
          category={program.category}
          categoryLabel={t(categoryLabelKey(program.category))}
          description={program.description}
          address={program.address}
          addressActions={addressActionsFor(t, program.address)}
          extra={servicesCard}
          // The same round actions a member sees under the name (D-224).
          quickActionsLabel={t('place.quick.label')}
          quickActions={[
            ...(program.website
              ? [
                  {
                    id: 'website',
                    label: t('place.quick.website'),
                    icon: <GlobeIcon {...QUICK} />,
                    href: program.website,
                    isExternal: true,
                  },
                ]
              : []),
            ...(program.phone
              ? [
                  {
                    id: 'call',
                    // The lead's own listing names the thing, not the verb
                    // (Will, 6 October, D-314): this is their number, to check.
                    label: t('program.quick.phone'),
                    description: displayPhone(program.phone),
                    icon: <PhoneIcon {...QUICK} />,
                    href: `tel:${program.phone}`,
                  },
                ]
              : []),
            ...(googlePlaceHref(program.name, program.address, null)
              ? [
                  {
                    id: 'google',
                    label: t('place.quick.google'),
                    icon: <PlacesIcon {...QUICK} />,
                    href: googlePlaceHref(program.name, program.address, null)!,
                    isExternal: true,
                  },
                ]
              : []),
            // What people sign before taking part (D-261), in the list with
            // the rest rather than alone at the foot (Will, 6 October, D-312).
            {
              id: 'policies',
              label: t('program.policies.row'),
              description: t('program.policies.rowBody', { count: policies.length }),
              icon: <BookIcon {...QUICK} />,
              href: '/program/policies/',
            },
          ]}
          labels={{
            hours: t('place.hours'),
            hoursOnGoogle: t('place.hoursOnGoogle'),
            about: t('place.about'),
            address: t('place.address'),
          }}
        />
      )}

      {note ? (
        <Text type="supporting" xstyle={styles.note}>
          {note}
        </Text>
      ) : null}
    </Page>
  );
}

/** The Program tab: the lead's own program, or the example one on a demo account (D-218, D-447). */
export function ProgramScreen() {
  const { t } = useI18n();
  const { state: session } = useSession();
  const setup = useProgramSetup(session);
  // No program yet (a fresh account, D-361): the tab is Add a program. Decided
  // once the database has answered, so sending one shows its "sent" screen
  // rather than swapping away.
  const [isAdding, setIsAdding] = useState<boolean | null>(null);
  useEffect(() => {
    if (isAdding === null && !setup.isLoading) setIsAdding(!setup.hasProgram);
  }, [isAdding, setup.isLoading, setup.hasProgram]);
  if (isAdding === null) return <Loading label="" variant="screen" />;
  if (isAdding) return <AddProgramView isTab />;
  // Sent, not approved yet: the tab is "Sent to Pam" until it is (D-379).
  if (setup.isUnderReview) return <ProgramReviewView />;
  const own = setup.program;
  if (own) {
    return (
      <ProgramView
        key={own.id}
        programId={own.id}
        program={{
          name: own.details.name,
          category: own.details.category as Category,
          description: own.details.description,
          address: own.details.address,
          phone: own.details.phone,
          website: own.details.website,
        }}
        isLive={own.isLive}
        pending={own.pendingChange}
        {...(own.pendingChange ? { onCancelPending: () => withdrawSubmission(own.pendingChange!.id) } : {})}
        onSave={(draft) => saveOwnProgram(own, draft)}
        canSwitch
      />
    );
  }
  const example = DUMMY_SAVED_BY_ROLE.member?.[0];
  return (
    <ProgramView
      program={{
        name: example?.name ?? 'Example Learning Center',
        category: example?.category ?? 'education',
        description: example?.description ?? '',
        address: example?.address ?? '',
        phone: example?.phone ?? '',
        website: '',
      }}
      note={t('program.example')}
    />
  );
}
