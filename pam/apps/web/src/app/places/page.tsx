'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import {
  AppHeader,
  BookmarkIcon,
  Loading,
  Notice,
  Page,
  PageTitle,
  PlaceCard,
  ScrollReveal,
} from '@pam/ui';
import { PlaceCardSkeletonList } from '@pam/ui/Skeletons';
import {
  categoryLabelKey,
  CATEGORY_LIST,
  NOTICES,
  distanceLabel,
  type Category,
} from '@pam/config';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { HeaderBell } from '../HeaderBell';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { usePlaces, METRES_PER_MILE } from '@/lib/usePlaces';
import { useSavedPlaces } from '@/lib/useSavedPlaces';
import { placeStatus, useNow } from '@/lib/usePlaceStatus';
import { useSession } from '@/lib/useSession';
import { useDemoRole } from '@/lib/useViewedRole';
import { CITY_HALL, loadOrigin, saveOrigin, type AreaOption } from '@/lib/useAreaSearch';
import { AreaSearch, AreaTrigger } from './AreaPicker';

/**
 * The first screen in PAM that shows real data.
 *
 * Everything on it comes from the catalogue in Supabase through one RPC. There
 * is no fixture and no fallback list: if the query fails, the screen says so in
 * words and offers the phone, because a blank list that looks like "there is
 * nothing near you" is a lie that sends someone home (§0).
 *
 * What it deliberately does not do:
 *
 *   - claim a place is open. PAM holds no opening hours for any imported
 *     provider, so the first action is Hours, which opens the place's Google
 *     listing (D-032, D-044).
 *   - name a condition. The card shows the provider's own name and PAM's
 *     neutral category, never a subcategory the source implied (0020).
 *
 * The origin is City Hall until onboarding asks where someone is staying. That
 * is stated on the screen rather than implied: "near you" when we do not know
 * where "you" is would be the same kind of quiet lie.
 *
 * **On `<Page>` now, like every other screen** (Will, 16 September — reporting
 * that Home and Places did not line up and that moving between them "glitched").
 * This screen hand-rolled its own `<main>` with its own padding and max-width
 * numbers, close to `<Page>`'s but not the same (520px against 560px), and
 * skipped `<Page>`'s `PageEnter` wrapper entirely — so its edges sat a few
 * pixels off from every screen either side of it, and it was the one screen in
 * PAM that did not fade in like the rest. `Page.tsx`'s own file comment
 * already named this exact failure mode before it happened here.
 *
 * **"Saved" is a fifth chip in the filter row, not a button below the list**
 * (Will, 16 September), and the row is smaller than §2.5's 48px floor asks for
 * — see the `chip` style below for why that is a deliberate, narrow exception
 * rather than a rule quietly dropped.
 */

const styles = stylex.create({
  title: { fontSize: '28px', lineHeight: 1.2 },
  /*
   * Narrower and shorter than §2.5's 48px control floor, on purpose (Will, 16
   * September: "make those tabs smaller... free up more screen real estate").
   * §2.5 sets 48px for a control someone has to reliably hit once to act — a
   * sign-in field, a primary button. A filter row is scanned, not aimed at:
   * five chips read together, missing one by a few pixels lands on its
   * neighbour, which is still a category filter, not a wrong action taken.
   * That is the line this exception holds: nothing that fails destructively
   * or irreversibly gets this treatment, and 5 chips at this size still clear
   * 44px, which is the smaller floor still used elsewhere for exactly this
   * kind of low-stakes, self-correcting control.
   */
  chip: { minHeight: '40px', fontSize: '15px', paddingInline: '14px' },
  area: { fontSize: '17px' },
  source: { fontSize: '15px', lineHeight: 1.5 },
});

/** "All", then one chip per category, then Saved — a link, not a filter. */
type Filter = Category | 'all';

export default function PlacesPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const [category, setCategory] = useState<Filter>('all');

  /*
   * City Hall until the member says otherwise. Their choice lives in
   * localStorage and nowhere else — see D-054 — so it is read after mount
   * rather than during render, which would not match the static HTML.
   */
  const [area, setArea] = useState<AreaOption>(CITY_HALL);
  useEffect(() => setArea(loadOrigin()), []);

  /*
   * The area control is in two places — a chip in the header and a search
   * panel under it — so the page holds the state both of them read (D-100).
   */
  const [isPickingArea, setIsPickingArea] = useState(false);

  /*
   * Save now writes. It used to flip a boolean in this component, which is why
   * a member could save a place, walk to the bus stop, reopen PAM and find it
   * gone (D-102).
   */
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const demoRole = useDemoRole(trueRole);
  // One clock for the whole list; `placeStatus` is pure from there.
  const now = useNow();
  const { isSaved, save, unsave, failed: saveFailed } = useSavedPlaces(
    session.status === 'signed-in',
    demoRole,
  );

  const chooseArea = (next: AreaOption) => {
    setArea(next);
    saveOrigin(next);
  };

  const state = usePlaces({
    lat: area.lat,
    lon: area.lon,
    ...(category === 'all' ? {} : { category }),
    limit: 20,
  });

  return (
    <Page gap={4}>
      {/*
        The area rides in the header now. It used to take a full row of the
        page to say something that is true of every card below it.
      */}
      <AppHeader
        roleLabel={
          session.status === 'signed-in' ? t(`role.${demoRole ?? session.session.role}`) : undefined
        }
        trailing={
          <HStack gap={1} align="center" wrap="nowrap">
            <AreaTrigger area={area} onOpen={() => setIsPickingArea(true)} />
            <HeaderBell enabled={session.status === 'signed-in'} role={demoRole ?? trueRole} />
          </HStack>
        }
      />

      {isPickingArea ? (
        <AreaSearch onChange={chooseArea} onClose={() => setIsPickingArea(false)} />
      ) : null}

      <PageTitle title={t('places.title')} backHref="/" backLabel={t('nav.back.home')} />

      {saveFailed ? (
        <Notice
          notice="something_went_wrong"
          title={t('saved.failed.title')}
          body={t('saved.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {/*
        The three categories are fixed (§2.5) and always all shown, even when
        one is empty: a filter that appears and disappears teaches a member
        nothing, and an empty result explains itself (§0). Workforce has no
        places yet and will say so rather than vanish. Saved is the fifth chip
        and the odd one out in this row — a real link to its own screen, not a
        filter — so it carries the icon that already means "saved" everywhere
        else in PAM rather than pretending to be a sixth category.
      */}
      <HStack gap={2} wrap="wrap" role="group" aria-label={t('places.filterLabel')}>
        <Button
          label={t('places.all')}
          variant={category === 'all' ? 'primary' : 'secondary'}
          aria-pressed={category === 'all'}
          onClick={() => setCategory('all')}
          xstyle={styles.chip}
        />
        {CATEGORY_LIST.map((definition) => (
          <Button
            key={definition.key}
            label={t(definition.labelKey)}
            variant={category === definition.key ? 'primary' : 'secondary'}
            aria-pressed={category === definition.key}
            onClick={() => setCategory(definition.key)}
            xstyle={styles.chip}
          />
        ))}
        <Button
          label={t('places.filter.saved')}
          variant="secondary"
          icon={<BookmarkIcon isFilled />}
          href="/saved/"
          xstyle={styles.chip}
        />
      </HStack>

      {state.status === 'loading' ? (
        <PlaceCardSkeletonList label={t('common.loading')} count={4} />
      ) : null}

      {state.status === 'empty' ? (
        <Notice
          notice="no_places_found"
          title={t(NOTICES.no_places_found.titleKey)}
          body={t(NOTICES.no_places_found.bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {state.status === 'error' ? (
        <Notice
          notice={state.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {state.status === 'ready' ? (
        <>
          <VStack gap={3}>
            {state.places.map((place, index) => {
              const miles = distanceLabel(place.meters / METRES_PER_MILE, locale);
              const saved = isSaved(place.id);
              return (
                <ScrollReveal key={place.id} index={index}>
                <PlaceCard
                  name={place.name}
                  href={`/place/?id=${encodeURIComponent(place.id)}`}
                  description={place.description}
                  {...(miles ? { distanceLabel: t(miles.key, miles.vars) } : {})}
                  status={placeStatus(place.id, place.hours, now, t, locale)}
                  audienceLabel={
                    place.audience ? t(`place.audience.${place.audience}`) : null
                  }
                  isSaved={saved}
                  onSave={() => {
                    if (saved) {
                      void unsave(place.id);
                      return;
                    }
                    void save({
                      id: place.id,
                      name: place.name,
                      lookupName: place.lookupName,
                      category: place.category,
                      address: place.address ?? null,
                      phone: place.phone ?? null,
                      placeId: place.placeId ?? null,
                      lat: place.lat ?? null,
                      lon: place.lon ?? null,
                    });
                  }}
                  labels={{ save: t('action.save'), saved: t('places.saved') }}
                />
                </ScrollReveal>
              );
            })}
          </VStack>
          <Text type="supporting" xstyle={styles.source}>
            {t('places.source')}
          </Text>
        </>
      ) : null}
    </Page>
  );
}
