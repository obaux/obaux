import { readFileSync } from 'node:fs';

// "About Pam" is built only when a language is signed (src/content/signed-off.json),
// or in a preview build (PAM_SITE_DRAFTS=1). `output: 'export'` refuses a dynamic
// route with an empty `generateStaticParams`, so while nothing is signed the route's
// files (`layout.about.tsx`, `page.about.tsx`) are not pages at all: the extension
// `about.tsx` is added to `pageExtensions` only when there is something to build.
const signed = JSON.parse(readFileSync(new URL('./src/content/signed-off.json', import.meta.url), 'utf8'));
const buildAbout = process.env.PAM_SITE_DRAFTS === '1' || (signed['about-pam'] ?? []).length > 0;

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', ...(buildAbout ? ['about.tsx'] : [])],
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
