import { appleMapsHref } from '@pam/ui';

type Translate = (key: string) => string;

/**
 * What the address card offers beside the words (Will, 9 October 2026:
 * "easily copied into Google Maps or Apple Maps to help them navigate"): a
 * copy button and a link into Apple Maps. Google Maps is the "Get directions"
 * button, so it is not repeated here.
 *
 * Coordinates are passed only where `directionsHref` uses them too — a picked
 * service has its own address and no point of its own — so both maps apps are
 * sent to the same door.
 */
export function addressActionsFor(t: Translate, address: string | null | undefined, lat?: number | null, lon?: number | null) {
  return {
    appleMapsHref: appleMapsHref(address, lat, lon) ?? null,
    labels: {
      copy: t('place.address.copy'),
      copied: t('place.address.copied'),
      copyFailed: t('place.address.copyFailed'),
      appleMaps: t('place.address.appleMaps'),
    },
  };
}
