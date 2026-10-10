import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from 'storybook/test';
import { POSTS } from '../../../../site/src/content/posts';
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
    await userEvent.type(box, 'unassigned');
    await expect(await within(canvasElement).findByText(/1 result for/)).toBeInTheDocument();
  },
};

/** A support post. One story for all of them: choose which in the controls. */
export const Post: StoryObj<{ slug: string }> = {
  args: { slug: POSTS[0]?.slug ?? '' },
  argTypes: {
    slug: {
      control: 'select',
      options: POSTS.map((p) => p.slug),
      labels: Object.fromEntries(POSTS.map((p) => [p.slug, p.title])),
    },
  },
  render: ({ slug }) => <WebsiteWalker start={`/support/${slug}/`} />,
};
