import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  logo: { height: '36px', width: 'auto', display: 'block' },
});

/** Pam's wordmark: deep green on a light page, the coral one on a dark page. */
export function Wordmark() {
  return (
    <picture>
      <source srcSet="/pam-wordmark-dark.svg" media="(prefers-color-scheme: dark)" />
      <img src="/pam-wordmark-light.svg" alt="Pam" {...stylex.props(styles.logo)} />
    </picture>
  );
}
