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
    const box = await within(canvasElement).findByRole('combobox', { name: 'Search Support' });
    await userEvent.type(box, 'reason');
    await expect(await within(canvasElement).findByText(/1 result for/)).toBeInTheDocument();
  },
};

/**
 * Support search with a person's own words (D-506): a sentence about what happened, not a keyword. The small words are
 * dropped and the best post comes first.
 */
export const SupportSearchOwnWords: Story = {
  render: () => <WebsiteWalker start="/support/" />,
  play: async ({ canvasElement }) => {
    const box = await within(canvasElement).findByRole('combobox', { name: 'Search Support' });
    await userEvent.type(box, 'why did my text not come');
    await expect(await within(canvasElement).findByText(/results? for/)).toBeInTheDocument();
  },
};

/** Suggestions as you type (D-507): after two letters, the likely questions drop down under the box, each with the article that answers it. */
export const SupportSearchSuggestions: Story = {
  render: () => <WebsiteWalker start="/support/" />,
  play: async ({ canvasElement }) => {
    const box = await within(canvasElement).findByRole('combobox', { name: 'Search Support' });
    await userEvent.type(box, 'why didn');
    await expect(await within(document.body).findByRole('option', { name: /Why didn’t I get a code\?/ })).toBeInTheDocument();
  },
};

/** A typing mistake is read as the word meant: "invte" finds Sending an invite. */
export const SupportSearchTypo: Story = {
  render: () => <WebsiteWalker start="/support/" />,
  play: async ({ canvasElement }) => {
    const box = await within(canvasElement).findByRole('combobox', { name: 'Search Support' });
    await userEvent.type(box, 'invte');
    await expect(await within(canvasElement).findByText('Sending an invite')).toBeInTheDocument();
  },
};

/** Nothing matched, but a known question shares a word: "Did you mean…" offers it. */
export const SupportSearchDidYouMean: Story = {
  render: () => <WebsiteWalker start="/support/" />,
  play: async ({ canvasElement }) => {
    const box = await within(canvasElement).findByRole('combobox', { name: 'Search Support' });
    await userEvent.type(box, 'probation');
    await expect(await within(canvasElement).findByText('Did you mean:')).toBeInTheDocument();
  },
};

/**
 * Support search that finds nothing: it says so plainly, keeps the topics, and keeps the way to a person ("Still stuck?",
 * the same words as Pam's Help screen). Never a dead end (A26).
 */
export const SupportSearchNothingFound: Story = {
  render: () => <WebsiteWalker start="/support/" />,
  play: async ({ canvasElement }) => {
    const box = await within(canvasElement).findByRole('combobox', { name: 'Search Support' });
    await userEvent.type(box, 'zzzz');
    await expect(await within(canvasElement).findByText(/We do not have an article for that yet/)).toBeInTheDocument();
    await expect(await within(canvasElement).findByText('Still stuck?')).toBeInTheDocument();
    await expect(await within(canvasElement).findByText('Browse by topic')).toBeInTheDocument();
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
 * The front page with the "About Pam" section. Will signed the English (D-483), so the live site shows it too and
 * **Home** above is the same page; this story shows the section whatever `signed-off.json` says.
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

/**
 * Signing a program's rules (members and programs), a draft until the signing screens are really in the app
 * and Will signs the English. English is the Support post (also **Post** above, by its title); the other six have
 * pages of their own, each with a Draft banner and a language list that links back to the English post. None is on
 * the site (`apps/site/src/content/signed-off.json`).
 */
export const ProgramRulesEnglish: Story = { render: () => <WebsiteWalker start="/support/signing-a-programs-rules/" /> };
export const ProgramRulesSpanish: Story = { render: () => <WebsiteWalker start="/es/program-rules/" /> };
export const ProgramRulesPortugueseBrazil: Story = { render: () => <WebsiteWalker start="/pt-BR/program-rules/" /> };
export const ProgramRulesChineseSimplified: Story = { render: () => <WebsiteWalker start="/zh-CN/program-rules/" /> };
export const ProgramRulesChineseTraditionalHongKong: Story = { render: () => <WebsiteWalker start="/zh-HK/program-rules/" /> };
export const ProgramRulesRussian: Story = { render: () => <WebsiteWalker start="/ru/program-rules/" /> };
export const ProgramRulesArabic: Story = { render: () => <WebsiteWalker start="/ar/program-rules/" /> };
