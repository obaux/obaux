'use client';

import { useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Card } from '@astryxdesign/core/Card';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton, BookIcon, SignedIcon, TextField, TextLink } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SignaturePad, type SignaturePadHandle } from '@pam/ui/SignaturePad';
import { SubPage } from '@pam/ui/SubPage';
import { placeAsksForPolicies, type DummyPolicy } from '@pam/config/dummy-policies';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { useI18n } from '@/lib/i18n';
import { usePolicies } from '@/lib/usePolicies';
import { useMySignatures } from '@/lib/useMySignatures';
import { leaveFlow } from '@/lib/navigate';

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
  // A signature on the page (D-271): even padding all round, so the tick
  // sits as far from the top edge as from the left; room for the corner ×.
  saved: {
    position: 'relative',
    width: '100%',
    padding: '16px',
    borderRadius: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  yourSignature: { fontSize: '16px', lineHeight: 1.4 },
  savedImage: { height: '48px', width: 'auto', maxWidth: '60%', objectFit: 'contain', backgroundColor: 'white', borderRadius: '8px' },
  signedImage: { height: '72px', width: 'auto', maxWidth: '100%', objectFit: 'contain', backgroundColor: 'white', borderRadius: '12px', alignSelf: 'flex-start' },
  // Sign sits right under the signature it will use (Will, D-271).
  // The pinned sign area (D-279): white, a hairline above, over the bottom
  // of the screen and its safe area; as wide as the page's column.
  dock: {
    position: 'fixed',
    insetInline: 0,
    bottom: 0,
    zIndex: 9,
    backgroundColor: colorVars['--color-background-body'],
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colorVars['--color-border'],
    paddingTop: '12px',
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
  },
  dockInner: { width: '100%', maxWidth: '560px', marginInline: 'auto', paddingInline: '16px' },
  dockSpacer: { height: '88px', flexShrink: 0 },
  dockSpacerTall: { height: '196px' },
  // The tiny white × on the box's corner: clear this signature and sign
  // again. 28px to look at, a 48px square to tap (§2.5) — every button keeps
  // the 48px floor, so the circle is drawn inside it.
  // Inside the box's top-right corner, level with the "Signed" line (Will,
  // 5 October: on a phone the old one hung off the edge as an oval).
  clear: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '48px',
    height: '48px',
    minWidth: '48px',
    padding: '0px',
    borderWidth: '0px',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    backgroundImage: { default: 'none', ':hover': 'none', ':active': 'none' },
    color: colorVars['--color-text-primary'],
  },
  // The circle you see, pinned in the middle of the 48px square you tap —
  // absolutely placed and fixed in size, so no browser's flex rules can
  // stretch it (Safari stretched the old one into a pill).
  clearDot: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    width: '28px',
    height: '28px',
    minWidth: '28px',
    minHeight: '28px',
    maxWidth: '28px',
    maxHeight: '28px',
    flexGrow: 0,
    flexShrink: 0,
    boxSizing: 'border-box',
    borderRadius: '50%',
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    boxShadow: '0 1px 4px light-dark(oklch(0 0 0 / 12%), oklch(0 0 0 / 40%))',
  },
  // The "Your signature:" box keeps its picture clear of the ×.
  savedRow: { paddingRight: '56px' },
  sheetLinks: { width: '100%' },
  // "Done" in the header, as on the Location drawer (D-275, D-279).
  doneButton: {
    minHeight: '48px',
    paddingInline: '4px',
    fontSize: '17px',
    fontWeight: 700,
    color: colorVars['--color-text-accent'],
    backgroundImage: { default: 'none', ':hover': 'none', ':active': 'none' },
  },
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
  // `via=list`: Done on the policy then leaves two screens, not one (D-279).
  return `/place/policies/view/?${new URLSearchParams({ place: placeId, name: placeName, id: policyId, via: 'list' }).toString()}`;
}

/** The program's own page — where Done lands when history cannot reach it. */
function placeHref(placeId: string): string {
  return `/place/?id=${encodeURIComponent(placeId)}`;
}

/**
 * Done, top right, where Help was (Will, 5 October, D-279: "a done button on
 * top right instead of help. Like we do on zipcode drawer"). It leaves the
 * whole signing flow — back to wherever it was started, usually the
 * program's page — where Back would only step through it one screen at a
 * time. Help is one screen away, on that page.
 */
function DoneButton({ steps, placeId }: { readonly steps: number; readonly placeId: string }) {
  const { t } = useI18n();
  return (
    <Button
      label={t('places.area.done')}
      variant="ghost"
      onClick={() => leaveFlow(steps, placeHref(placeId))}
      xstyle={styles.doneButton}
    />
  );
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
      actions={<DoneButton steps={1} placeId={placeId} />}
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
            <>
              <HStack gap={2} align="center" wrap="nowrap">
                <SignedIcon {...ICON} {...stylex.props(styles.signedIcon)} />
                <Text xstyle={styles.done}>{t('memberPolicies.done')}</Text>
              </HStack>
              {/* All signed: the way out is the screen's one button (D-279). */}
              <BigButton label={t('memberPolicy.finish')} onPress={() => leaveFlow(1, placeHref(placeId))} />
            </>
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
  via = null,
}: {
  readonly placeId: string;
  readonly placeName: string;
  readonly policyId: string | null;
  /** `list` when opened from the list, so Done leaves both (D-279). */
  readonly via?: string | null;
}) {
  const { t, locale } = useI18n();
  const { policies } = usePolicies();
  const { signature, signedAt, signedWith, sign, unsign, forgetSignature } = useMySignatures();
  // Moving to the next policy happens here, not by a new link: the same
  // screen with a different `?id=` would reload the app (D-269).
  const [currentId, setCurrentId] = useState<string | null>(policyId);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const day = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' });

  const shown = placeAsksForPolicies(placeId) ? policies : [];
  const index = shown.findIndex((p) => p.id === (currentId ?? policyId));
  const policy: DummyPolicy | null = index >= 0 ? shown[index]! : null;
  const when = policy ? signedAt(placeId, policy.id) : null;
  const signedImage = policy ? signedWith(placeId, policy.id) : null;
  const next = policy ? shown.find((p, i) => i !== index && !signedAt(placeId, p.id)) : undefined;

  const signNow = (drawn?: string) => {
    if (!policy) return;
    sign(placeId, policy.id, drawn);
    setSheetOpen(false);
  };

  return (
    <>
      <SubPage
        title={policy?.title ?? t('memberPolicies.title')}
        subtitle={policy ? t('memberPolicy.count', { current: index + 1, total: shown.length }) : undefined}
        backHref={policiesHref(placeId, placeName)}
        backLabel={t('nav.back.policiesToSign')}
        actions={<DoneButton steps={via === 'list' ? 2 : 1} placeId={placeId} />}
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
                  {signedImage ? (
                    <img src={signedImage} alt={t('memberPolicy.yourSignature')} {...stylex.props(styles.signedImage)} />
                  ) : null}
                  <ClearSignature
                    label={t('memberPolicy.clear')}
                    onPress={() => {
                      // Off this policy, and a fresh signature to sign it with.
                      unsign(placeId, policy.id);
                      forgetSignature();
                      setSheetOpen(true);
                    }}
                  />
                </VStack>
              </>
            ) : null}
            {/* Room under the last line for the pinned sign area (D-279). */}
            <VStack aria-hidden xstyle={[styles.dockSpacer, !when && signature ? styles.dockSpacerTall : null]} />

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
      {policy ? (
        // Pinned to the bottom (Will, 5 October, D-279): Sign, Next and Done
        // stay under the same thumb from the first policy to the last. Outside
        // the page, so nothing on the page can carry it off.
        <VStack xstyle={styles.dock}>
          <VStack gap={3} xstyle={styles.dockInner}>
            {when ? (
              next ? (
                <BigButton
                  label={t('memberPolicy.next', { title: next.title })}
                  onPress={() => {
                    setCurrentId(next.id);
                    window.scrollTo(0, 0);
                  }}
                />
              ) : (
                // The last one signed: Done leaves the flow, as the header's
                // Done does (D-279).
                <BigButton
                  label={t('memberPolicy.finish')}
                  onPress={() => leaveFlow(via === 'list' ? 2 : 1, placeHref(placeId))}
                />
              )
            ) : (
              <>
                {signature ? (
                  // Signed once already: Sign is one tap, right under the
                  // signature it will use; the corner × draws a new one.
                  <HStack
                    gap={3}
                    align="center"
                    justify="between"
                    wrap="nowrap"
                    xstyle={[styles.saved, styles.savedRow]}
                  >
                    <Text type="supporting" xstyle={styles.yourSignature}>
                      {t('memberPolicy.withSaved')}
                    </Text>
                    <img src={signature} alt={t('memberPolicy.yourSignature')} {...stylex.props(styles.savedImage)} />
                    <ClearSignature
                      label={t('memberPolicy.clear')}
                      onPress={() => {
                        forgetSignature();
                        setSheetOpen(true);
                      }}
                    />
                  </HStack>
                ) : null}
                <BigButton
                  label={t('memberPolicy.sign')}
                  onPress={() => (signature ? signNow() : setSheetOpen(true))}
                />
              </>
            )}
          </VStack>
        </VStack>
      ) : null}
    </>
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
          <HStack gap={2} align="center" justify="between" wrap="nowrap" xstyle={styles.sheetLinks}>
            <TextLink
              label={t(isTyping ? 'sign.drawInstead' : 'sign.type')}
              onClick={() => {
                pad.current?.clear();
                setName('');
                setTyping((on) => !on);
              }}
            />
            <TextLink
              label={t('sign.clear')}
              isDisabled={!hasInk}
              onClick={() => {
                pad.current?.clear();
                setName('');
              }}
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

/** The tiny white × on a signature's corner (D-271): clear it and sign again. */
function ClearSignature({ label, onPress }: { readonly label: string; readonly onPress: () => void }) {
  return (
    <IconButton
      label={label}
      variant="ghost"
      icon={
        <HStack align="center" justify="center" xstyle={styles.clearDot}>
          <Icon icon="close" size="sm" />
        </HStack>
      }
      onClick={onPress}
      xstyle={styles.clear}
    />
  );
}
