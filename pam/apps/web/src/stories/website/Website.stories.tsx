import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from 'storybook/test';
import { ALL_POSTS } from '../../../../site/src/content/posts';
import { WebsiteWalker } from './WebsiteWalker';

/**
 * The public website, page by page (D-437). Every story is the whole site —
 * header, page, footer — and every link inside it works, so any of them can be
 * walked on from. **Support › Case manager assignments** and the rest of the
 * posts are one story, **Post**: pick the post in the controls. A new post
 * appears there on its own (add it to `apps/site/src/content/posts.ts`).
 *
 * The site's links to the app (Sign in, Privacy, Terms) are named in the console
 * and not followed. The site never calls Supabase, so there are no fixtures.
 */
const meta = {
  title: 'Website/Journey',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** The front page: what Pam is, how it helps, who it is for. Click through from here. */
export const Home: Story = { render: () => <WebsiteWalker start="/" /> };

/** Support's index: search, topics and popular articles. */
export const Support: Story = { render: () => <WebsiteWalker start="/support/" /> };

/** Support with a search typed in, and its one match. */
export const SupportSearch: Story = {
  render: () => <WebsiteWalker start="/support/" />,
  play: async ({ canvasElement }) => {
    const box = await within(canvasElement).findByRole('textbox', { name: 'Search Support' });
    await userEvent.type(box, 'reason');
    await expect(await within(canvasElement).findByText(/1 result for/)).toBeInTheDocument();
  },
};

/**
 * A support post. One story for all of them: choose which in the controls.
 * **Drafts are here too**, with a banner, so they can be reviewed before they
 * are published; the site itself never builds them.
 */
export const Post: StoryObj<{ slug: string }> = {
  args: { slug: ALL_POSTS.find((p) => p.status !== 'draft')?.slug ?? '' },
  argTypes: {
    slug: {
      control: 'select',
      options: ALL_POSTS.map((p) => p.slug),
      labels: Object.fromEntries(ALL_POSTS.map((p) => [p.slug, p.status === 'draft' ? `${p.title} (draft)` : p.title])),
    },
  },
  render: ({ slug }) => <WebsiteWalker start={`/support/${slug}/`} />,
};

/**
 * The front page with the "About Pam" section, as it will look once Will signs the
 * English. The live site hides the section until then (`signed-off.json` in
 * `apps/site/src/content/signed-off.json`), so **Home** above is what is live today.
 */
export const HomeWithAboutPam: Story = { render: () => <WebsiteWalker start="/" showAbout /> };

/**
 * About Pam, one language per story, each with its Draft banner. They are not on the
 * site: Will signs the English, and the other six are drafts until a native reader
 * has been over them (D-461). The language list at the top of each page links to the
 * other six. The page is `/<lang>/about-pam/`; Arabic reads right to left.
 */
export const AboutPamEnglish: Story = { render: () => <WebsiteWalker start="/en/about-pam/" /> };
export const AboutPamSpanish: Story = { render: () => <WebsiteWalker start="/es/about-pam/" /> };
export const AboutPamPortugueseBrazil: Story = { render: () => <WebsiteWalker start="/pt-BR/about-pam/" /> };
export const AboutPamChineseSimplified: Story = { render: () => <WebsiteWalker start="/zh-CN/about-pam/" /> };
export const AboutPamChineseTraditionalHongKong: Story = { render: () => <WebsiteWalker start="/zh-HK/about-pam/" /> };
export const AboutPamRussian: Story = { render: () => <WebsiteWalker start="/ru/about-pam/" /> };
export const AboutPamArabic: Story = { render: () => <WebsiteWalker start="/ar/about-pam/" /> };
