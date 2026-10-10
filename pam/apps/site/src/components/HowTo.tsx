import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Screenshot } from './Screenshot';
import { Steps } from './Steps';

const WIDE = '@media (min-width: 760px)';

const styles = stylex.create({
  // The steps card and the picture card: side by side on a desktop, stacked on a phone.
  row: {
    width: '100%',
    alignItems: 'flex-start',
    flexDirection: { default: 'column', [WIDE]: 'row' },
    gap: { default: '12px', [WIDE]: '20px' },
  },
  // "How to find it in the app": a card with a black outline (the page's primary text colour).
  steps: {
    flex: 1,
    minWidth: 0,
    boxSizing: 'border-box',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-icon-primary'],
    borderRadius: '20px',
    padding: { default: '18px', [WIDE]: '28px' },
    backgroundColor: colorVars['--color-background-card'],
  },
  stepsTitle: { fontWeight: 700 },
  // The pictures: a light gray card, a tint lighter than the page as wide as the layout
  // allows, the screenshots centred in it with room all round.
  shots: {
    flex: 1,
    minWidth: 0,
    boxSizing: 'border-box',
    borderRadius: '20px',
    // A light gray on the white page (the site's own background gray), with a hairline, as on Figma Learn;
    // the requirements banner is a deeper gray.
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    padding: { default: '28px 20px', [WIDE]: '48px 40px' },
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '24px',
  },
  shot: { alignItems: 'center', maxWidth: '300px', width: '100%' },
  caption: { textAlign: 'center' },
});

export interface Shot {
  /** The file under `public/help/`. */
  readonly name: string;
  readonly alt: string;
  readonly caption?: string;
}

/** One or more screenshots in the light gray card, centred. */
export function ShotCard({ shots }: { readonly shots: readonly Shot[] }) {
  return (
    <HStack xstyle={styles.shots}>
      {shots.map((shot) => (
        <VStack key={shot.name} gap={2} xstyle={styles.shot}>
          <Screenshot name={shot.name} alt={shot.alt} />
          {shot.caption ? (
            <Text type="supporting" xstyle={styles.caption}>
              {shot.caption}
            </Text>
          ) : null}
        </VStack>
      ))}
    </HStack>
  );
}

/**
 * How to find it in the app: the numbered steps in a card with a black outline, and, when there
 * are pictures, the light gray picture card next to it (stacked under it on a phone).
 */
export function HowTo({
  steps,
  shots = [],
  title = 'In the app',
}: {
  readonly steps: readonly string[];
  readonly shots?: readonly Shot[];
  readonly title?: string;
}) {
  return (
    <HStack xstyle={styles.row}>
      <VStack gap={4} xstyle={styles.steps}>
        <Text type="supporting" xstyle={styles.stepsTitle}>
          {title}
        </Text>
        <Steps items={steps} />
      </VStack>
      {shots.length > 0 ? <ShotCard shots={shots} /> : null}
    </HStack>
  );
}
