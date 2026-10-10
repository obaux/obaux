import { appleMapsHref, directionsHref } from '@pam/ui';

type Translate = (key: string) => string;

/**
 * What the address card offers beside the words (Will, 9 October 2026:
 * "easily copied into Google Maps or Apple Maps to help them navigate"): a
 * small copy button, and "Open in…", a drawer with Google Maps and Apple Maps.
 *
 * Coordinates are passed only where the "Get directions" link uses them too — a
 * picked service has its own address and no point of its own — so both maps
 * apps, and that link, are sent to the same door.
 */
export function addressActionsFor(
  t: Translate,
  address: string | null | undefined,
  lat?: number | null,
  lon?: number | null,
  placeId?: string | null,
) {
  return {
    googleMapsHref: directionsHref(address, lat, lon, placeId) ?? null,
    appleMapsHref: appleMapsHref(address, lat, lon) ?? null,
    labels: {
      copy: t('place.address.copy'),
      copied: t('place.address.copied'),
      copyFailed: t('place.address.copyFailed'),
      openIn: t('place.address.openIn'),
      openInTitle: t('place.address.openInTitle'),
      googleMaps: t('place.address.app.google'),
      appleMaps: t('place.address.app.apple'),
      opensInApp: t('place.address.opensInApp'),
    },
  };
}
