/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Capacitor wraps a static export (§1). Keeping the web build static from day
  // one means the native shells never diverge from what the browser gets.
  // Server-side work lives in Supabase Edge Functions, not in Next route
  // handlers, so nothing here needs a Node runtime.
  output: 'export',
  images: { unoptimized: true },

  // Workspace packages ship TypeScript source; Next compiles them in place.
  transpilePackages: ['@pam/ui', '@pam/config', '@pam/db', '@astryxdesign/core'],

  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  webpack: (config) => {
    // Workspace packages are TypeScript source that imports siblings with an
    // explicit `.js` extension (the form Node ESM requires). Webpack does not
    // map those back to `.ts` on its own the way Vite does, so it is spelled
    // out here. Without this, every cross-file import inside @pam/config and
    // @pam/ui fails to resolve.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
