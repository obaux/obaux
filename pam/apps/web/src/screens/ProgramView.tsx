'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { categoryLabelKey, type Category, displayPhone } from '@pam/config';
import { DUMMY_SAVED_BY_ROLE } from '@pam/config/dummy-places';
import { BookIcon, GlobeIcon, Page, PhoneIcon, PlaceDetail, PlacesIcon, PlusIcon, TextField, TextLink, googlePlaceHref } from '@pam/ui';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { MenuList } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';
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
 * **Example program, saved in the page only, for now.** A program lead may
 * already update their own organisation's listing (`services_write_provider`,
 * 0007); loading it and writing the edit back is the follow-up. Until then
 * the screen draws the example program and keeps edits for the visit.
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
}: {
  readonly program: ProgramDetailsData;
  readonly note?: string | null;
}) {
  const { t } = useI18n();
  const [program, setProgram] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<ProgramDetailsData>) => setDraft((d) => ({ ...d, ...patch }));
  const { policies } = usePolicies();
  const { forPlace } = useServices();
  const services = forPlace(PROGRAM_PLACE_ID);

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

  const save = () => {
    if (draft.name.trim() === '') return;
    setProgram({ ...draft, name: draft.name.trim() });
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
            onClick={() => {
              if (editing) {
                save();
                return;
              }
              setDraft(program);
              setSaved(false);
              setEditing(true);
            }}
            xstyle={styles.edit}
          />
        }
      />

      {saved ? <Text xstyle={styles.saved}>{t('program.saved')}</Text> : null}

      {editing ? (
        <Card padding={6}>
          <VStack gap={3}>
            <TextField
              label={t('program.name')}
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
          phone={program.phone || null}
          website={program.website || null}
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
            directions: t('place.directions'),
            call: t('place.call'),
            website: t('place.website'),
            hours: t('place.hours'),
            hoursOnGoogle: t('place.hoursOnGoogle'),
            about: t('place.about'),
            address: t('place.address'),
            save: t('place.save'),
            saved: t('places.saved'),
            share: t('place.share'),
            flag: t('place.flag'),
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

/** The Program tab, with the example program until the real listing is loaded (D-218). */
export function ProgramScreen() {
  const { t } = useI18n();
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
