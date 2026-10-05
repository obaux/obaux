import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page, PageTitle, type PageTitleProps } from '@pam/ui';
import { useStoryText } from '../support/useStoryText';

/**
 * A screen's name with the way back beside it (§0: never dead-end). The arrow
 * is a real link with a name that says where it goes — "Back to Home", never
 * just "Back".
 */
function LocalisedTitle({ title, subtitle, backLabel, ...rest }: PageTitleProps) {
  const tr = useStoryText();
  return <PageTitle {...rest} title={tr(title)} subtitle={tr(subtitle) ?? undefined} backLabel={tr(backLabel) ?? undefined} />;
}

const meta = {
  title: 'Components/PageTitle',
  component: PageTitle,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  render: (args) => <LocalisedTitle {...args} />,
  args: { title: 'places.title', backHref: '/', backLabel: 'nav.back.home' },
  argTypes: { titleControl: { control: false } },
} satisfies Meta<typeof PageTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithBack: Story = {};

/** The start of things: no way back to draw. */
export const WithoutBack: Story = { args: { title: 'home.title', backHref: undefined, backLabel: undefined } };

export const WithSubtitle: Story = {
  args: { title: 'saved.title', subtitle: 'saved.count?count=3', backLabel: 'nav.back.home' },
};

/** A place's own screen: the catalogue name is the title, and it wraps. */
export const LongPlaceName: Story = {
  args: {
    title: 'Free Library of Philadelphia — Joseph E. Coleman Northwest Regional Library',
    backHref: '/places/',
    backLabel: 'nav.back.places',
  },
};

export const Spanish: Story = { ...WithSubtitle, globals: { locale: 'es' } };
