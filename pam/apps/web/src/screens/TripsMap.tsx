'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/navigate';

/**
 * The map behind Trips (D-213): a pin for every visit somebody has agreed to
 * make, so they can find their way around the city by them.
 *
 * **Google Maps when there is a key.** `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — a
 * browser key, restricted to PAM's domains in the Google Cloud console — loads
 * the Maps JavaScript API and drops a marker per trip; tapping one opens the
 * place. No key, no request to Google.
 *
 * **Without one — Storybook — or when Google refuses or cannot load, a drawn preview**: a plain street
 * grid with the same pins, placed by their real coordinates relative to each
 * other, labelled as a preview. It is never passed off as a real map.
 */
export interface TripPin {
  readonly id: string;
  readonly name: string;
  /** Short — "Thu, Oct 3". */
  readonly when: string;
  readonly lat: number;
  readonly lon: number;
  readonly href: string;
  readonly art: ReactNode;
}

const KEY = process.env['NEXT_PUBLIC_GOOGLE_MAPS_KEY'] ?? '';

const styles = stylex.create({
  map: { position: 'absolute', inset: 0, overflow: 'hidden' },
  preview: {
    backgroundColor: 'light-dark(#EEF1EC, #22262A)',
    // A quiet street grid: two sets of lines, one heavier for main roads.
    backgroundImage:
      'linear-gradient(light-dark(#FFFFFF, #2E3338) 2px, transparent 2px), linear-gradient(90deg, light-dark(#FFFFFF, #2E3338) 2px, transparent 2px), linear-gradient(light-dark(#FFFFFF, #2E3338) 6px, transparent 6px), linear-gradient(90deg, light-dark(#FFFFFF, #2E3338) 6px, transparent 6px)',
    backgroundSize: '44px 44px, 44px 44px, 220px 220px, 220px 220px',
  },
  previewLabel: {
    position: 'absolute',
    insetInlineStart: '16px',
    top: '96px',
    fontSize: '13px',
    paddingInline: '10px',
    paddingBlock: '4px',
    borderRadius: '999px',
    backgroundColor: colorVars['--color-background-body'],
  },
  pin: {
    position: 'absolute',
    transform: 'translate(-50%, -100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    textDecoration: 'none',
    color: 'inherit',
    minWidth: '48px',
    minHeight: '48px',
  },
  pinAt: (left: number, top: number) => ({ left: `${left}%`, top: `${top}%` }),
  // A black disc with a tip, the icon white inside it, smaller (Will,
  // 5 October, D-268, after the reference's "Your stay" pin).
  pinTile: {
    position: 'relative',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#FFFFFF',
    backgroundColor: '#111111',
    color: '#FFFFFF',
    boxShadow: '0 3px 10px oklch(0 0 0 / 28%)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The tip: a small black square turned 45°, tucked under the disc.
  pinTip: {
    position: 'absolute',
    bottom: '-6px',
    left: '50%',
    width: '10px',
    height: '10px',
    marginInlineStart: '-5px',
    transform: 'rotate(45deg)',
    backgroundColor: '#111111',
    borderRadius: '2px',
  },
  pinName: { fontSize: '12px', fontWeight: 700, textAlign: 'center', maxWidth: '120px', lineHeight: 1.2, marginTop: '8px' },
  pinWhen: { fontSize: '12px', textAlign: 'center', whiteSpace: 'nowrap' },
});

export function TripsMap({ pins }: { readonly pins: readonly TripPin[] }) {
  // If Google will not draw — the key refused, the script blocked, no
  // connection — the drawn preview takes over rather than a blank map.
  const [failed, setFailed] = useState(false);
  return KEY && !failed ? (
    <GoogleTripsMap pins={pins} onFail={() => setFailed(true)} />
  ) : (
    <PreviewTripsMap pins={pins} />
  );
}

/** The drawn stand-in: pins placed by coordinate within the upper map area. */
function PreviewTripsMap({ pins: all }: { readonly pins: readonly TripPin[] }) {
  const { t } = useI18n();
  // One pin per place, labelled with its soonest visit (the list is in date
  // order): two trips to the same place drew one label over the other (D-225).
  const pins = all.filter(
    (pin, index) => all.findIndex((other) => other.lat === pin.lat && other.lon === pin.lon) === index,
  );
  const lats = pins.map((p) => p.lat);
  const lons = pins.map((p) => p.lon);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLon, maxLon] = [Math.min(...lons), Math.max(...lons)];
  // Pins sit in the band the half-open drawer leaves visible.
  const place = (p: TripPin) => ({
    left: pins.length < 2 || maxLon === minLon ? 50 : 24 + ((p.lon - minLon) / (maxLon - minLon)) * 52,
    top: pins.length < 2 || maxLat === minLat ? 36 : 26 + ((maxLat - p.lat) / (maxLat - minLat)) * 18,
  });

  return (
    <VStack xstyle={[styles.map, styles.preview]} role="region" aria-label={t('trips.map.label')}>
      <Text type="supporting" xstyle={styles.previewLabel}>
        {t('trips.map.preview')}
      </Text>
      {pins.map((pin) => {
        const at = place(pin);
        return (
          <a
            key={pin.id}
            href={pin.href}
            aria-label={`${pin.name}, ${pin.when}`}
            {...stylex.props(styles.pin, styles.pinAt(at.left, at.top))}
          >
            <VStack xstyle={styles.pinTile} aria-hidden>
              <VStack xstyle={styles.pinTip} />
              {pin.art}
            </VStack>
            <Text xstyle={styles.pinName} aria-hidden>
              {pin.name}
            </Text>
            <Text type="supporting" xstyle={styles.pinWhen} aria-hidden>
              {pin.when}
            </Text>
          </a>
        );
      })}
    </VStack>
  );
}

/* --------------------------------------------------------------------------
 * Google Maps. Loaded once, on demand, only when a key is configured.
 */

interface GoogleMapsGlobal {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => { fitBounds: (b: unknown, pad?: number) => void };
    LatLngBounds: new () => { extend: (p: { lat: number; lng: number }) => void };
    Marker: new (opts: Record<string, unknown>) => { addListener: (ev: string, fn: () => void) => void };
  };
}

declare global {
  interface Window {
    google?: GoogleMapsGlobal;
    __pamMapsLoading?: Promise<GoogleMapsGlobal>;
    /** Google calls this when it refuses the key (wrong site, API off). */
    gm_authFailure?: () => void;
  }
}

/** A black disc with a white ring and a tip, for Google's markers (D-268). */
const PIN_SVG =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">' +
      '<path d="M18 45 L12 32 A17 17 0 1 1 24 32 Z" fill="#111" stroke="#fff" stroke-width="2"/>' +
      '<circle cx="18" cy="17" r="5" fill="#fff"/></svg>',
  );

function loadGoogleMaps(): Promise<GoogleMapsGlobal> {
  if (window.google?.maps) return Promise.resolve(window.google);
  window.__pamMapsLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}`;
    script.async = true;
    script.onload = () => (window.google ? resolve(window.google) : reject(new Error('maps')));
    script.onerror = () => reject(new Error('maps'));
    document.head.appendChild(script);
  });
  return window.__pamMapsLoading;
}

function GoogleTripsMap({ pins, onFail }: { readonly pins: readonly TripPin[]; readonly onFail: () => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLElement | null>(null);
  // The caller builds a new array on every render; redraw only when the pins
  // themselves change (a search narrowing them), not on every keystroke.
  const latest = useRef(pins);
  latest.current = pins;
  const signature = pins.map((pin) => `${pin.id}@${pin.lat},${pin.lon}`).join('|');

  const fail = useRef(onFail);
  fail.current = onFail;

  useEffect(() => {
    window.gm_authFailure = () => fail.current();
    return () => {
      window.gm_authFailure = undefined;
    };
  }, []);

  useEffect(() => {
    const pins = latest.current;
    let cancelled = false;
    void loadGoogleMaps()
      .then((google) => {
        if (cancelled || !ref.current) return;
        const map = new google.maps.Map(ref.current, {
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });
        const bounds = new google.maps.LatLngBounds();
        for (const pin of pins) {
          const position = { lat: pin.lat, lng: pin.lon };
          bounds.extend(position);
          const marker = new google.maps.Marker({
            map,
            position,
            title: `${pin.name}, ${pin.when}`,
            // The same black pin as the drawn preview (D-268).
            icon: { url: PIN_SVG, anchor: { x: 18, y: 44 } },
          });
          marker.addListener('click', () => navigate(pin.href));
        }
        // Room at the bottom for the half-open drawer.
        map.fitBounds(bounds, 80);
      })
      .catch(() => {
        if (!cancelled) fail.current();
      });
    return () => {
      cancelled = true;
    };
  }, [signature]);

  return <VStack ref={ref as never} xstyle={styles.map} role="region" aria-label={t('trips.map.label')} />;
}
