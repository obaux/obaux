/**
 * Builds @pam/ui into `dist/` — the design system as a package anything can
 * mount, not only the app (Will, 6 October: "Make sure dist/ builds cleanly…
 * tokens lived in dist/tokens.css").
 *
 *   dist/
 *     index.js, *.js        components, compiled (StyleX → class names)
 *     *.d.ts                their types
 *     theme/pam.js          the Astryx theme object (`PamProvider` uses it)
 *     tokens.css            every token as a CSS custom property
 *     fonts.css, fonts/     Figtree, self-hosted
 *     stylex.css            the components' own rules
 *     styles.css            THE stylesheet: imports tokens.css and fonts.css,
 *                           then the layer order, Astryx's base, Pam's theme
 *                           and stylex.css, inlined, in the app's order
 *
 * Use: import '@pam/ui/dist/styles.css', wrap in <PamProvider>, render.
 *
 * StyleX runs with the app's options (apps/web/.babelrc.js), so a component
 * built here and one compiled in the app come out the same. `pnpm build`.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, '..');
const src = join(pkg, 'src');
const dist = join(pkg, 'dist');
const require = createRequire(import.meta.url);
const babel = require('@babel/core');
const stylexPlugin = require('@stylexjs/babel-plugin');

execFileSync(process.execPath, [join(here, 'tokens.mjs'), '--check'], { stdio: 'inherit' });

rmSync(dist, { recursive: true, force: true });

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const rules = [];
let compiled = 0;
for (const file of walk(src)) {
  const rel = relative(src, file);
  const out = join(dist, rel);
  mkdirSync(dirname(out), { recursive: true });
  if (/\.d\.ts$/.test(file) || /\.(css|woff2|js|svg|png)$/.test(file)) {
    copyFileSync(file, out);
    continue;
  }
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  // The theme's source only feeds `pnpm theme`; dist ships what it built.
  if (rel === join('theme', 'pam.theme.ts')) continue;
  const result = babel.transformFileSync(file, {
    babelrc: false,
    configFile: false,
    sourceMaps: false,
    presets: [
      [require.resolve('@babel/preset-typescript'), { isTSX: file.endsWith('.tsx'), allExtensions: true, onlyRemoveTypeImports: false }],
      [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
    ],
    plugins: [
      [
        stylexPlugin,
        {
          dev: false,
          runtimeInjection: false,
          genConditionalClasses: true,
          treeshakeCompensation: true,
          unstable_moduleResolution: { type: 'commonJS', rootDir: pkg },
        },
      ],
    ],
  });
  if (result?.metadata?.stylex) rules.push(...result.metadata.stylex);
  writeFileSync(out.replace(/\.tsx?$/, '.js'), result.code + '\n');
  compiled += 1;
}

const stylexCss = stylexPlugin.processStylexRules(rules, false);
writeFileSync(join(dist, 'stylex.css'), stylexCss);

// fonts.css and its files sit at the root of dist, next to tokens.css.
mkdirSync(join(dist, 'fonts'), { recursive: true });
for (const f of readdirSync(join(src, 'fonts'))) copyFileSync(join(src, 'fonts', f), join(dist, 'fonts', f));
writeFileSync(join(dist, 'fonts.css'), readFileSync(join(src, 'styles/fonts.css'), 'utf8').replaceAll("url('../fonts/", "url('./fonts/"));
copyFileSync(join(src, 'styles/tokens.css'), join(dist, 'tokens.css'));

const read = (p) => readFileSync(p, 'utf8');
const styles = [
  '/* @pam/ui — the whole stylesheet. Wrap what you render in <PamProvider>. */',
  '@layer reset, astryx-base, astryx-theme, stylex, pam;',
  '@import "./tokens.css";',
  '@import "./fonts.css";',
  '',
  '/* Astryx reset */',
  read(require.resolve('@astryxdesign/core/reset.css')),
  '/* Astryx base */',
  read(require.resolve('@astryxdesign/core/astryx.css')),
  '/* Pam theme (theme/pam.css) */',
  read(join(src, 'theme/pam.css')),
  '/* Pam components (StyleX) */',
  '@layer stylex {',
  stylexCss,
  '}',
  '',
].join('\n');
// @import must precede everything but @charset and @layer statements.
writeFileSync(join(dist, 'styles.css'), styles);

execFileSync(require.resolve('typescript/bin/tsc'), ['-p', join(pkg, 'tsconfig.build.json')], { stdio: 'inherit', cwd: pkg });

console.log(`@pam/ui: ${compiled} modules, ${rules.length} StyleX rules → dist/`);
