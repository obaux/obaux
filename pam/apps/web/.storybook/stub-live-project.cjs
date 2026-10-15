/**
 * Webpack loader for Storybook only (D-579): in the two files that fall back to Pam's live Supabase project when no environment says
 * otherwise (`src/lib/project.ts`, the public site's `src/lib/links.ts`), the live URL and publishable key become the stub's. The
 * fallback then cannot reach production whatever the environment is, and the built Storybook never contains the live address
 * (`scripts/check-storybook-stub.mjs` fails the build if it does).
 */
module.exports = function stubLiveProject(source) {
  return source
    .replaceAll('https://shobqzuhicoiymtumiaz.supabase.co', 'https://stub.supabase.co')
    .replaceAll('sb_publishable_-Wl4FRkeoRtyQ6OeKnT9Xw_V0vzicKJ', 'stub-anon-key-for-storybook');
};
