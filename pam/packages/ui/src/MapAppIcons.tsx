import * as stylex from '@stylexjs/stylex';

/**
 * The two maps apps a person may open an address in, as app symbols in square
 * frames, in full colour (Will, 9 October 2026: "use their icons, in full
 * colour, app symbol in square frames"; the artwork he supplied the next day).
 *
 * Both are 192px squares in `apps/web/public/maps/`, drawn here at 1em so the
 * caller sets the size, and **rounded by the same radius** (`RADIUS`, 22% of the
 * side) so they sit as a pair:
 *
 * - Google Maps: the pin on Google's light grey (`#f1f3f4`).
 * - Apple Maps: Apple's icon, cropped in 5% so its own rounded corners and edge
 *   glow are outside the frame — no grey or transparent corner shows behind the
 *   rounding.
 *
 * Both are the companies' marks, used to say which app a link opens, nothing
 * more. They are listed in Foundations › Imagery. A change to the radius is one
 * line here; a change to the crop means making the picture again (the Apple one
 * was cropped for a 22% radius).
 *
 * Not tinted (an app's icon keeps its colours on a dark page), and `alt=""`: the
 * row's words name the app.
 */
export const MAP_APP_ICON_RADIUS = '22%';

const styles = stylex.create({
  icon: {
    display: 'block',
    width: '1em',
    height: '1em',
    flexShrink: 0,
    borderRadius: MAP_APP_ICON_RADIUS,
    objectFit: 'cover',
  },
});

/** Google Maps: the pin on light grey. */
export function GoogleMapsAppIcon() {
  return <img src="/maps/google-maps.webp" alt="" width={192} height={192} {...stylex.props(styles.icon)} />;
}

/** Apple Maps: its map and arrow, cropped to the frame. */
export function AppleMapsAppIcon() {
  return <img src="/maps/apple-maps.webp" alt="" width={192} height={192} {...stylex.props(styles.icon)} />;
}
