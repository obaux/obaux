import { readFileSync } from 'node:fs';

// Pages in one language are built only when something is signed (src/content/signed-off.json),
// or in a preview build (PAM_SITE_DRAFTS=1). `output: 'export'` refuses a dynamic route with
// an empty `generateStaticParams`, so while nothing is signed the route's files
// (`layout.lang.tsx`, `page.about.tsx`, `page.rules.tsx`) are not pages at all: their extensions
// are added to `pageExtensions` only when there is something to build. "About Pam" needs a
// signed language; "Signing a program's rules" needs one AND `program-rules-live` (the signing
// screens are really in the app).
const signed = JSON.parse(readFileSync(new URL('./src/content/signed-off.json', import.meta.url), 'utf8'));
const drafts = process.env.PAM_SITE_DRAFTS === '1';
const buildAbout = drafts || (signed['about-pam'] ?? []).length > 0;
const buildRules = drafts || (signed['program-rules-live'] === true && (signed['program-rules'] ?? []).some((l) => l !== 'en'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', ...(buildAbout ? ['about.tsx'] : []), ...(buildRules ? ['rules.tsx'] : []), ...(buildAbout || buildRules ? ['lang.tsx'] : [])],
  reactStrictMode: true,

  // The public site is a folder of static files, like the app: no Node runtime,
  // any host can serve it. `trailingSlash` emits `support/index.html`, so
  // `/support/` works on a host that does not rewrite extensionless paths.
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,

  // Same reasoning as apps/web/next.config.mjs: the workspace packages ship
  // TypeScript source, and @astryxdesign/core is deliberately left out — its
  // class names are keyed to the precompiled astryx.css it ships.
  transpilePackages: ['@pam/ui'],

  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
