/**
 * Next 15 uses SWC by default; adding a Babel config switches this app to Babel
 * so the StyleX transform can run. StyleX has no SWC plugin at 0.19.
 *
 * Cost: slower builds than SWC. Accepted because StyleX is a fixed choice in
 * SOP §1 and correctness of the design system beats build speed here. Revisit
 * when StyleX ships an SWC transform.
 */
module.exports = {
  presets: ['next/babel'],
  plugins: [
    [
      '@stylexjs/babel-plugin',
      {
        dev: process.env.NODE_ENV === 'development',
        runtimeInjection: false,
        genConditionalClasses: true,
        treeshakeCompensation: true,
        unstable_moduleResolution: { type: 'commonJS', rootDir: __dirname },
      },
    ],
  ],
};
