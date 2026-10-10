import type { ComponentType, SVGProps } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import {
  BellIcon,
  BookmarkIcon,
  DocumentIcon,
  EditIcon,
  FlagIcon,
  GlobeIcon,
  HomeIcon,
  MeIcon,
  MeIconFilled,
  Page,
  PdfIcon,
  PeopleIcon,
  PhoneIcon,
  PhotoIcon,
  PlacesIcon,
  ShareIcon,
  ShieldIcon,
  StarIcon,
} from '@pam/ui';

/**
 * Pam's own icons, for everything Astryx's chrome set has no picture of —
 * home, places, people, the plan. Drawn to Astryx's conventions (24 viewBox,
 * 1.5 stroke, `currentColor`, a 1em box), so they size with the text around
 * them and colour with it. Drawn plainly: a clever icon is a worse icon for
 * somebody reading without their glasses.
 */
const styles = stylex.create({
  tile: { width: '96px' },
  glyph: { fontSize: '32px', lineHeight: 1, color: colorVars['--color-icon-accent'] },
  big: { fontSize: '64px' },
  name: { fontSize: '13px', textAlign: 'center' },
});

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  HomeIcon,
  PlacesIcon,
  PeopleIcon,
  MeIcon,
  MeIconFilled,
  PhoneIcon,
  BellIcon,
  EditIcon,
  BookmarkIcon,
  ShareIcon,
  FlagIcon,
  ShieldIcon,
  GlobeIcon,
  StarIcon,
  PhotoIcon,
  PdfIcon,
  DocumentIcon,
};

function Gallery({ size }: { readonly size: 'regular' | 'big' }) {
  return (
    <HStack gap={3} wrap="wrap">
      {Object.entries(ICONS).map(([name, Glyph]) => (
        <VStack key={name} gap={1} align="center" xstyle={styles.tile}>
          <Text xstyle={[styles.glyph, size === 'big' && styles.big]}>
            <Glyph />
          </Text>
          <Text type="supporting" xstyle={styles.name}>
            {name}
          </Text>
        </VStack>
      ))}
      <VStack gap={1} align="center" xstyle={styles.tile}>
        <Text xstyle={[styles.glyph, size === 'big' && styles.big]}>
          <BookmarkIcon isFilled />
        </Text>
        <Text type="supporting" xstyle={styles.name}>
          BookmarkIcon isFilled
        </Text>
      </VStack>
    </HStack>
  );
}

const meta = {
  title: 'Foundations/Icons',
  tags: ['autodocs'],
  component: Gallery,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  args: { size: 'regular' },
  argTypes: { size: { control: 'inline-radio', options: ['regular', 'big'] } },
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** At 64px, where a wobbly path or a stray join shows. */
export const Large: Story = { args: { size: 'big' } };
