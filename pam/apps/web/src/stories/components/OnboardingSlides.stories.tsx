import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { Badge } from '@astryxdesign/core/Badge';
import { VStack } from '@astryxdesign/core/VStack';
import { Page } from '@pam/ui';
import { OnboardingSlides, type OnboardingSlidesProps } from '@pam/ui/OnboardingSlides';
import { useI18n } from '@/lib/i18n';
import { useStoryText } from '../support/useStoryText';

/**
 * What Pam is, in three sentences over three photos of the city — the hero on
 * the first step of sign-in. It runs edge to edge past the page gutter, plays
 * itself every six seconds (not under reduced motion), and shows a skeleton
 * in each slide until its photo has arrived.
 *
 * The lines are the `onboarding.1`–`3` keys `/signin/` uses, so the Language
 * toolbar changes them.
 */
const styles = stylex.create({
  mark: { height: '40px', width: 'auto', display: 'block' },
});

/** The white mark and the region, as `/signin/` overlays them on the art. */
function HeroHeader() {
  const { t } = useI18n();
  return (
    <VStack gap={4} align="center">
      <img src="/pam-wordmark-white.svg" alt="Pam" {...stylex.props(styles.mark)} />
      <Badge variant="neutral" label={t('signin.city')} />
    </VStack>
  );
}

function LocalisedSlides({ slides, label, header }: OnboardingSlidesProps) {
  const tr = useStoryText();
  return (
    <OnboardingSlides
      slides={slides.map((slide) => ({ ...slide, text: tr(slide.text) }))}
      label={tr(label)}
      header={header}
    />
  );
}

const SLIDES: OnboardingSlidesProps['slides'] = [
  { id: 'places', image: '/onboarding/hero-city.webp', text: 'onboarding.1' },
  { id: 'people', image: '/onboarding/hero-phone.webp', text: 'onboarding.2' },
  { id: 'plan', image: '/onboarding/hero-sneakers.webp', text: 'onboarding.3' },
];

const meta = {
  title: 'Components/OnboardingSlides',
  component: OnboardingSlides,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedSlides {...args} />,
  args: { slides: SLIDES, label: 'onboarding.label', header: <HeroHeader /> },
  argTypes: { header: { control: false } },
} satisfies Meta<typeof OnboardingSlides>;

export default meta;
type Story = StoryObj<typeof meta>;

/** As `/signin/` shows it: the mark and "Philadelphia" over the photos. */
export const SignIn: Story = {};

/** Without the overlaid header. */
export const Bare: Story = { args: { header: undefined } };

/** One slide: no autoplay, one dot. */
export const SingleSlide: Story = { args: { slides: SLIDES.slice(0, 1) } };

/** Photos that have not arrived (a slow connection): a skeleton under each line. */
export const PhotosLoading: Story = {
  args: {
    slides: SLIDES.map((slide) => ({ ...slide, image: `/onboarding/not-yet-${slide.id}.webp` })),
  },
};

export const Spanish: Story = { globals: { locale: 'es' } };
