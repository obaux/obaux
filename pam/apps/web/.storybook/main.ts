import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/nextjs';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '..');
const require = createRequire(import.meta.url);
// The app's own StyleX plugin entry, options and all, so a story and a page
// compile to the same class names.
const babelrc = require('../.babelrc.js') as { plugins: unknown[] };

/**
 * PAM's Storybook: every @pam/ui component, whole screens ("journeys"), and
 * the app shell, rendered from the same source the app ships.
 *
 * Styling has to come out exactly as the app's does. StyleX class names are
 * minted by `@stylexjs/babel-plugin` (options in .babelrc.js, reused below)
 * and their CSS collected by `@stylexjs/postcss-plugin` (postcss.config.mjs,
 * which `@storybook/nextjs` picks up itself) into the `@stylex;` directive in
 * globals.css. If either half ran differently, components would render with
 * class names and no rules behind them — the failure this project has
 * already shipped once. Checked by measuring a rendered BigButton: 64px,
 * PAM green, Figtree, 18px.
 */
const config: StorybookConfig = {
  stories: ['../src/stories/**/*.mdx', '../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/nextjs',
    options: { nextConfigPath: '../next.config.mjs' },
  },
  staticDirs: ['../public'],
  docs: { defaultName: 'About' },
  // Storybook reads next.config but not its `webpack()` hook, so the same
  // `.js` -> `.ts` alias the workspace packages need is repeated here.
  webpackFinal: async (webpack) => {
    // `@storybook/nextjs` switches to Babel only for a file named exactly
    // `.babelrc` or `babel.config.js`; this app's is `.babelrc.js`, so it
    // compiles with SWC and StyleX's `stylex.create()` survives to runtime
    // ("Styles must be compiled by '@stylexjs/babel-plugin'"). Renaming the
    // app's config would change the production build, so instead the StyleX
    // transform runs first, alone, with parse-only TypeScript/JSX, and SWC
    // compiles what it leaves.
    webpack.module = webpack.module ?? {};
    webpack.module.rules = [
      {
        test: /\.[jt]sx?$/,
        enforce: 'pre',
        include: [join(app, 'src'), join(app, '.storybook'), join(app, '../../packages/ui/src')],
        use: {
          loader: require.resolve('babel-loader'),
          options: {
            babelrc: false,
            configFile: false,
            parserOpts: { plugins: ['typescript', 'jsx'] },
            plugins: babelrc.plugins,
          },
        },
      },
      ...(webpack.module.rules ?? []),
    ];
    webpack.resolve = webpack.resolve ?? {};
    webpack.resolve.extensionAlias = {
      ...webpack.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    return webpack;
  },
};

export default config;
