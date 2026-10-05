'use client';

import { useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton, BookIcon, SignedIcon, TextField } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SignaturePad, type SignaturePadHandle } from '@pam/ui/SignaturePad';
import { SubPage } from '@pam/ui/SubPage';
import { placeAsksForPolicies, type DummyPolicy } from '@pam/config/dummy-policies';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { useI18n } from '@/lib/i18n';
import { usePolicies } from '@/lib/usePolicies';
import { useMySignatures } from '@/lib/useMySignatures';
import { HelpButton } from './HelpButton';

/**
 * A program's policies, from the member's side (D-270, Will, 5 October:
 * "so users can preview them ahead of time … tap to sign, then a half screen
 * drawer opens and they can draw their name using their finger, and once a
 * signature is drawn once, they should be able to re-use it").
 *
 * - **The list** (`/place/policies/?id=`), from the bottom of a place's page
 *   or from a trip: each policy with whether it is signed, and one button
 *   that takes you through the unsigned ones in order.
 * - **One policy** (`/place/policies/view/?place=&id=`): its words, then
 *   Sign. The first time, Sign opens a half-height sheet to draw (or type) a
 *   signature. After that, Sign signs straight away with the saved one —
 *   shown next to the button, with a way to sign a new way — the way a
 *   signing app asks for your signature once and then each line is a tap.
 * - **After signing**, the button moves on: "Next: Liability disclaimer",
 *   then Done. Nobody has to go back to the list to find the next one.
 *
 * Example data (`usePolicies`, `useMySignatures`): nothing is sent to the
 * program yet.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  progress: { fontSize: '17px', fontWeight: 600 },
  body: { fontSize: '18px', lineHeight: 1.6 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  done: { fontSize: '17px', lineHeight: 1.5 },
  signedIcon: { color: colorVars['--color-icon-accent'], flexShrink: 0 },
  signedWords: { fontSize: '17px', fontWeight: 600, color: colorVars['--color-text-accent'] },
  // The saved signature, small, beside "Sign uses your signature".
  saved: {
    width: '100%',
    paddingBlock: '12px',
    paddingInline: '16px',
    borderRadius: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  savedImage: { height: '48px', width: 'auto', maxWidth: '60%', objectFit: 'contain', backgroundColor: 'white', borderRadius: '8px' },
  signedImage: { height: '72px', width: 'auto', maxWidth: '100%', objectFit: 'contain', backgroundColor: 'white', borderRadius: '12px', alignSelf: 'flex-start' },
  link: { minHeight: '48px', paddingInline: '0px', fontSize: '16px', alignSelf: 'flex-start' },
  // Clear of the grab handle, as the New message sheet is.
  sheet: { width: '100%', paddingInline: '20px', paddingBlockStart: spacingVars['--spacing-6'], paddingBottom: '24px' },
  sheetTitle: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700 },
  sheetHint: { fontSize: '17px', lineHeight: 1.45 },
  sheetRow: { width: '100%' },
  close: {
    width: '48px',
    height: '48px',
    flexShrink: 0,
    borderRadius: '50%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
});

/** The place's name: from the link, or the example set. */
export function placeNameFor(placeId: string, fromLink: string | null): string {
  return fromLink || DUMMY_PLACES_BY_ID[placeId]?.name || '';
}

function policiesHref(placeId: string, placeName: string): string {
  return `/place/policies/?${new URLSearchParams({ id: placeId, name: placeName }).toString()}`;
}

function policyHref(placeId: string, placeName: string, policyId: string): string {
  return `/place/policies/view/?${new URLSearchParams({ place: placeId, name: placeName, id: policyId }).toString()}`;
}

export { policiesHref };

export function MemberPoliciesScreen({ placeId, placeName }: { readonly placeId: string; readonly placeName: string }) {
  const { t, locale } = useI18n();
  const { policies } = usePolicies();
  const { signedAt, progress } = useMySignatures();
  const day = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' });
  const shown = placeAsksForPolicies(placeId) ? policies : [];
  const { signed, total } = progress(placeId, shown);
  const firstUnsigned = shown.find((p) => !signedAt(placeId, p.id));

  return (
    <SubPage
      title={t('memberPolicies.title')}
      subtitle={placeName || undefined}
      backHref={`/place/?id=${encodeURIComponent(placeId)}`}
      backLabel={t('nav.back.place')}
      actions={<HelpButton />}
    >
      {shown.length === 0 ? (
        <Text type="supporting" xstyle={styles.intro}>
          {t('memberPolicies.none')}
        </Text>
      ) : (
        <>
          <Text type="supporting" xstyle={styles.intro}>
            {t('memberPolicies.intro', { place: placeName })}
          </Text>
          <Text xstyle={styles.progress}>{t('memberPolicies.progress', { signed, total })}</Text>
          <MenuList
            label={t('memberPolicies.title')}
            hasDividers
            items={shown.map((policy) => {
              const when = signedAt(placeId, policy.id);
              return {
                id: policy.id,
                label: policy.title,
                description: when
                  ? t('memberPolicies.signedOn', { date: day.format(new Date(when)) })
                  : t('memberPolicies.needed'),
                href: policyHref(placeId, placeName, policy.id),
                icon: when ? <SignedIcon {...ICON} {...stylex.props(styles.signedIcon)} /> : <BookIcon {...ICON} />,
              };
            })}
          />
          {firstUnsigned ? (
            <BigButton
              label={t(signed === 0 ? 'memberPolicies.start' : 'memberPolicies.continue')}
              href={policyHref(placeId, placeName, firstUnsigned.id)}
            />
          ) : (
            <HStack gap={2} align="center" wrap="nowrap">
              <SignedIcon {...ICON} {...stylex.props(styles.signedIcon)} />
              <Text xstyle={styles.done}>{t('memberPolicies.done')}</Text>
            </HStack>
          )}
        </>
      )}
    </SubPage>
  );
}

export function MemberPolicyScreen({
  placeId,
  placeName,
  policyId,
}: {
  readonly placeId: string;
  readonly placeName: string;
  readonly policyId: string | null;
}) {
  const { t, locale } = useI18n();
  const { policies } = usePolicies();
  const { signature, signedAt, sign } = useMySignatures();
  // Moving to the next policy happens here, not by a new link: the same
  // screen with a different `?id=` would reload the app (D-269).
  const [currentId, setCurrentId] = useState<string | null>(policyId);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const day = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' });

  const shown = placeAsksForPolicies(placeId) ? policies : [];
  const index = shown.findIndex((p) => p.id === (currentId ?? policyId));
  const policy: DummyPolicy | null = index >= 0 ? shown[index]! : null;
  const when = policy ? signedAt(placeId, policy.id) : null;
  const next = policy ? shown.find((p, i) => i !== index && !signedAt(placeId, p.id)) : undefined;

  const signNow = (drawn?: string) => {
    if (!policy) return;
    sign(placeId, policy.id, drawn);
    setSheetOpen(false);
  };

  return (
    <SubPage
      title={policy?.title ?? t('memberPolicies.title')}
      subtitle={policy ? t('memberPolicy.count', { current: index + 1, total: shown.length }) : undefined}
      backHref={policiesHref(placeId, placeName)}
      backLabel={t('nav.back.policiesToSign')}
      actions={<HelpButton />}
    >
      {policy ? (
        <>
          <Card padding={6}>
            <VStack gap={3}>
              {policy.body.length > 0 ? (
                policy.body.map((para, i) => (
                  <Text key={i} xstyle={styles.body}>
                    {para}
                  </Text>
                ))
              ) : (
                <Text type="supporting" xstyle={styles.body}>
                  {t('policy.preview.file', { file: policy.fileName })}
                </Text>
              )}
            </VStack>
          </Card>

          {when ? (
            <>
              {/* Signed: the signature on the page, and the way on. */}
              <VStack gap={2} xstyle={styles.saved}>
                <HStack gap={2} align="center" wrap="nowrap">
                  <SignedIcon {...ICON} {...stylex.props(styles.signedIcon)} />
                  <Text xstyle={styles.signedWords}>
                    {t('memberPolicy.signed', { date: day.format(new Date(when)) })}
                  </Text>
                </HStack>
                {signature ? (
                  <img src={signature} alt={t('memberPolicy.yourSignature')} {...stylex.props(styles.signedImage)} />
                ) : null}
              </VStack>
              {next ? (
                <BigButton
                  label={t('memberPolicy.next', { title: next.title })}
                  onPress={() => {
                    setCurrentId(next.id);
                    window.scrollTo(0, 0);
                  }}
                />
              ) : (
                <BigButton label={t('memberPolicy.finish')} href={policiesHref(placeId, placeName)} />
              )}
            </>
          ) : (
            <>
              {signature ? (
                // Signed once already: Sign is one tap, and says with what.
                <VStack gap={1}>
                  <HStack gap={3} align="center" justify="between" wrap="nowrap" xstyle={styles.saved}>
                    <Text type="supporting" xstyle={styles.note}>
                      {t('memberPolicy.withSaved')}
                    </Text>
                    <img src={signature} alt={t('memberPolicy.yourSignature')} {...stylex.props(styles.savedImage)} />
                  </HStack>
                  <Button
                    label={t('memberPolicy.redraw')}
                    variant="ghost"
                    onClick={() => setSheetOpen(true)}
                    xstyle={styles.link}
                  />
                </VStack>
              ) : null}
              <BigButton
                label={t('memberPolicy.sign')}
                onPress={() => (signature ? signNow() : setSheetOpen(true))}
              />
            </>
          )}

          <SignSheet
            isOpen={isSheetOpen}
            title={policy.title}
            onClose={() => setSheetOpen(false)}
            onSign={(drawn) => signNow(drawn)}
          />
        </>
      ) : (
        <Text type="supporting" xstyle={styles.intro}>
          {t('memberPolicies.none')}
        </Text>
      )}
    </SubPage>
  );
}

/**
 * The half-height sheet a signature is drawn in (D-270). `purpose="form"`:
 * a swipe down while drawing would otherwise close the sheet and lose the
 * signature, so only Cancel (or Escape) closes it.
 */
function SignSheet({
  isOpen,
  title,
  onClose,
  onSign,
}: {
  readonly isOpen: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly onSign: (signature: string) => void;
}) {
  const { t } = useI18n();
  const pad = useRef<SignaturePadHandle | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [isTyping, setTyping] = useState(false);
  const [name, setName] = useState('');

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => (open ? undefined : onClose())}
      label={t('sign.title', { title })}
      purpose="form"
      height="hug"
    >
      {isOpen ? (
        <VStack gap={3} xstyle={styles.sheet}>
          <HStack gap={3} align="start" justify="between" wrap="nowrap" xstyle={styles.sheetRow}>
            <Heading level={2} xstyle={styles.sheetTitle}>
              {t('sign.heading')}
            </Heading>
            {/* The way out: a swipe cannot close this sheet (purpose="form"). */}
            <IconButton
              label={t('sign.cancel')}
              variant="ghost"
              icon={<Icon icon="close" size="md" />}
              onClick={onClose}
              xstyle={styles.close}
            />
          </HStack>
          <Text type="supporting" xstyle={styles.sheetHint}>
            {t(isTyping ? 'sign.typeHint' : 'sign.draw')}
          </Text>
          {isTyping ? (
            <TextField
              label={t('sign.name')}
              value={name}
              purpose="name"
              onChange={(value: string) => {
                setName(value);
                pad.current?.setTyped(value);
              }}
            />
          ) : null}
          <SignaturePad
            ref={pad}
            label={t('sign.pad')}
            placeholder={t('sign.placeholder')}
            onInkChange={setHasInk}
          />
          <HStack gap={2} align="center" justify="between" wrap="nowrap" xstyle={styles.sheetRow}>
            <Button
              label={t(isTyping ? 'sign.drawInstead' : 'sign.type')}
              variant="ghost"
              onClick={() => {
                pad.current?.clear();
                setName('');
                setTyping((on) => !on);
              }}
              xstyle={styles.link}
            />
            <Button
              label={t('sign.clear')}
              variant="ghost"
              isDisabled={!hasInk}
              onClick={() => {
                pad.current?.clear();
                setName('');
              }}
              xstyle={styles.link}
            />
          </HStack>
          <BigButton
            label={t('sign.agree')}
            isDisabled={!hasInk}
            onPress={() => {
              const drawn = pad.current?.toDataURL();
              if (drawn) onSign(drawn);
            }}
          />
          <Text type="supporting" xstyle={styles.note}>
            {t('sign.keep')}
          </Text>
        </VStack>
      ) : null}
    </BottomSheet>
  );
}
