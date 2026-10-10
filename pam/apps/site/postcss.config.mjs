import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * StyleX compiles to static CSS. This plugin collects what the Babel transform
 * emits across the app and the workspace packages and substitutes it for the
 * `@stylex;` directive in globals.css.
 *
 * Two things here are easy to get wrong and silently produce an app with no
 * styles behind correct-looking class names:
 *
 *  1. `include` must list every source that calls `stylex.create`. Files the
 *     plugin never reads contribute no rules.
 *  2. The plugin defaults to the project's own Babel config, and `.babelrc.js`
 *     is file-relative — it does not apply to `packages/ui`, which lives
 *     outside this app. Those files would then be parsed as plain JavaScript
 *     and fail on the first `import type`. Hence the explicit presets below.
 */
const config = {
  plugins: {
    '@stylexjs/postcss-plugin': {
      cwd: here,
      include: [
        'src/**/*.{js,jsx,ts,tsx}',
        '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
      ],
      babelConfig: {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
        // The StyleX plugin itself has to be listed here. Overriding
        // babelConfig replaces the project config wholesale, so without this
        // line the plugin parses every file and extracts nothing: `@stylex;`
        // resolves to an empty string and every component renders with correct
        // class names and no rules behind them.
        plugins: [
          [
            '@stylexjs/babel-plugin',
            {
              dev: process.env.NODE_ENV === 'development',
              runtimeInjection: false,
              unstable_moduleResolution: { type: 'commonJS', rootDir: here },
            },
          ],
        ],
      },
      // Output goes into the `stylex` layer declared in globals.css, so the
      // plugin must not wrap it in a layer of its own.
      useCSSLayers: false,
    },
    autoprefixer: {},
  },
};

export default config;
