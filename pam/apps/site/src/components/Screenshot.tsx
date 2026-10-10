import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { SHOT_SIZES } from '../content/screenshotSizes';

const styles = stylex.create({
  // A phone screen: narrow, rounded, with a hairline so a white screen does not melt
  // into a white page. Never wider than the column on a small phone.
  picture: {
    display: 'block',
    width: '100%',
    maxWidth: '300px',
    height: 'auto',
    borderRadius: '24px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  frame: { alignItems: 'center' },
});

/**
 * A screenshot of Pam, taken from Storybook at phone width with pretend people and
 * places only (`apps/site/scripts/screenshots.mjs` and `screenshots.json`; never
 * a real name, phone number or email). `alt` says what is on the screen, for someone
 * who cannot see it, and the steps in the text never depend on the picture alone.
 */
export function Screenshot({
  name,
  alt,
  caption,
}: {
  /** The file under `public/help/`, as listed in `screenshots.json` (`out`). */
  readonly name: string;
  readonly alt: string;
  readonly caption?: string;
}) {
  const size = SHOT_SIZES[name] ?? { w: 390, h: 844 };
  return (
    <VStack gap={2} xstyle={styles.frame}>
      <img
        src={`/help/${name}`}
        alt={alt}
        width={size.w}
        height={size.h}
        loading="lazy"
        {...stylex.props(styles.picture)}
      />
      {caption ? <Text type="supporting">{caption}</Text> : null}
    </VStack>
  );
}
