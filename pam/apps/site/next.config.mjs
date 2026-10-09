/** @type {import('next').NextConfig} */
const nextConfig = {
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
