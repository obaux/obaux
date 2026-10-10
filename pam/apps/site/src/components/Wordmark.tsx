import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  // Smaller on a narrow phone, so the header holds Home, Support and Sign in at 320px.
  logo: { height: { default: '36px', '@media (max-width: 400px)': '26px' }, width: 'auto', display: 'block' },
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
