# Google's attribution logo

Google requires its "Google Maps" logo beside street suggestions that come from its Places API (Policies and attributions for Places API).
The files here are **exactly as Google publishes them**: not recoloured, redrawn, resized in the file or recompressed. Pam serves them itself; nothing loads from Google.

## Where they came from

Google's own attribution set (`Google_Maps_Attribution_Assets.zip`), downloaded by Will and given to the merge desk on 14 October 2026 (card a81). The whole set, unchanged and without the macOS extras, is on `mira/google-maps-attribution-assets` in `docs/design/google-maps-attribution-assets/`, with its README. Only two files are used here, renamed for Pam; the contents are Google's:

| Here | Google's file | For |
|---|---|---|
| `google-maps-attribution-light.svg` | `GoogleMaps_Logo_Gray/GoogleMaps_Logo_Gray.svg` (#5E5E5E, 98 × 18) | light backgrounds |
| `google-maps-attribution-dark.svg` | `GoogleMaps_Logo_White/GoogleMaps_Logo_White.svg` (#FFFFFF, 98 × 18) | dark backgrounds |

The choice follows Google's rule: the version that contrasts with what is behind it. The street suggestions sit on the drawer's flat surface, so Gray on light and White on dark. The `WithLightOutline` and `WithDarkOutline` sets are for over a map or a photo; Pam does not put the logo there. The SVGs were checked for scripts, links and foreign objects: none.

## Size and words: not confirmed by Will

`PoweredByGoogle.tsx` draws it 18px high (Google's page says 16 to 19) with the alt text "Google Maps", and shows the words "Google Maps" if the file fails to load. Those figures and that wording come from Google's page as the merge desk read it on 13 October. **Will did not confirm them against Google's page.** Check them there before launch.
