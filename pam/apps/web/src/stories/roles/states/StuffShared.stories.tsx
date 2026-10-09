import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Thumbnail } from '@astryxdesign/core/Thumbnail';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { ChoiceChips } from '@pam/ui/ChoiceChips';
import { DocumentIcon, GlobeIcon, PdfIcon } from '@pam/ui';
import { MenuList, type MenuItem } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';

/**
 * **Mockups, not built** (Will, 9 October): "I don't like the image carousel.
 * Scratch that idea. Instead let's just title page: Stuff shared, and create a
 * flat list item, similar to policy item (not a card with shadow) and
 * streamline the photo (tiny preview), docs (any kind) and also links, lets
 * add links shared go on the list, with social image previews. Let's mockup
 * some versions of this multi media list before you build."
 *
 * Every version is the policy row (`MenuList`, dividers, 64px, 18px name,
 * 14px grey line, chevron) with a small preview where the icon goes: the
 * photo itself; a document's icon on a tint of its colour (PDF red, Word and
 * Google Docs blue, Google Sheets green); a link's social image, or a globe
 * when the page has none. Newest first. What differs is how the list is cut
 * and how big the previews are:
 *
 * - **A · One list** — everything together, 48px previews.
 * - **B · By day** — the same rows under Today / Yesterday / a date, like the
 *   conversation's own day dividers; each row says only the time.
 * - **C · Filters** — All · Photos · Docs · Links chips over one list;
 *   when it was sent sits at the end of the row.
 * - **D · Bigger previews** — 72px previews (links wider, the shape of a
 *   social image), the row wrapping to two lines.
 *
 * Example data only; nothing here reads the conversation. English only until
 * a version is chosen.
 */

type Kind = 'photo' | 'pdf' | 'word' | 'gdoc' | 'gsheet' | 'link';

interface Shared {
  readonly id: string;
  readonly kind: Kind;
  /** A photo's words, a document's name, a page's title. */
  readonly title: string;
  readonly who: string;
  readonly day: 'Today' | 'Yesterday' | 'Mon, Oct 6';
  readonly time: string;
  /** "PDF · 180 kB", "Google Doc" — documents only. */
  readonly detail?: string;
  /** The page's address — links only. */
  readonly site?: string;
  /** The photo, or the link's social image. */
  readonly image?: string;
}

const SHARED: readonly Shared[] = [
  {
    id: 'l1',
    kind: 'link',
    title: 'Free resume workshop this Saturday',
    site: 'example-library.org',
    image: '/friend/bring-a-friend-800.webp',
    who: 'Teresa',
    day: 'Today',
    time: '9:12\u00a0AM',
  },
  { id: 'p1', kind: 'photo', title: 'Is this the one?', image: '/onboarding/hero-city.webp', who: 'You', day: 'Today', time: '8:40\u00a0AM' },
  { id: 'd1', kind: 'pdf', title: 'ID office letter.pdf', detail: 'PDF · 180 kB', who: 'Teresa', day: 'Today', time: '7:47\u00a0AM' },
  { id: 'd2', kind: 'gdoc', title: 'Class schedule', detail: 'Google Doc', who: 'Teresa', day: 'Yesterday', time: '4:05\u00a0PM' },
  { id: 'p2', kind: 'photo', title: 'Photo', image: '/onboarding/hero-sneakers.webp', who: 'Teresa', day: 'Yesterday', time: '2:30\u00a0PM' },
  { id: 'l2', kind: 'link', title: 'Route 47 bus times', site: 'example-transit.org', who: 'You', day: 'Yesterday', time: '11:02\u00a0AM' },
  { id: 'd3', kind: 'word', title: 'Marcus resume.docx', detail: 'Word · 48 kB', who: 'You', day: 'Mon, Oct 6', time: '3:15\u00a0PM' },
  { id: 'd4', kind: 'gsheet', title: 'Monthly budget', detail: 'Google Sheet', who: 'Teresa', day: 'Mon, Oct 6', time: '10:20\u00a0AM' },
  { id: 'p3', kind: 'photo', title: 'Photo', image: '/onboarding/hero-phone.webp', who: 'You', day: 'Mon, Oct 6', time: '9:00\u00a0AM' },
];

const styles = stylex.create({
  list: { width: '100%' },
  // The preview where a policy row has its icon.
  square48: { width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0 },
  square72: { width: '72px', height: '72px', borderRadius: '12px', flexShrink: 0 },
  // A social image is about 1.91:1; at 72px tall it is 96 wide.
  wide72: { width: '96px', height: '72px', borderRadius: '12px', flexShrink: 0 },
  tile: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  glyph48: { fontSize: '28px', lineHeight: 1 },
  glyph72: { fontSize: '36px', lineHeight: 1 },
  red: { backgroundColor: colorVars['--color-background-red'], color: colorVars['--color-icon-red'] },
  blue: { backgroundColor: colorVars['--color-background-blue'], color: 'var(--pam-document-blue)' },
  green: { backgroundColor: colorVars['--color-background-green'], color: colorVars['--color-icon-green'] },
  grey: { backgroundColor: colorVars['--color-background-gray'], color: colorVars['--color-icon-secondary'] },
  day: { fontSize: '16px', lineHeight: 1.3, fontWeight: 600, paddingBlockStart: '8px' },
});

function Preview({ item, size }: { readonly item: Shared; readonly size: 48 | 72 }) {
  if (item.image) {
    const shape = size === 48 ? styles.square48 : item.kind === 'link' ? styles.wide72 : styles.square72;
    return <Thumbnail src={item.image} label={item.title} xstyle={shape} />;
  }
  const tint =
    item.kind === 'pdf' ? styles.red : item.kind === 'gsheet' ? styles.green : item.kind === 'link' ? styles.grey : styles.blue;
  const Glyph = item.kind === 'pdf' ? PdfIcon : item.kind === 'link' ? GlobeIcon : DocumentIcon;
  const box = size === 48 ? styles.square48 : item.kind === 'link' ? styles.wide72 : styles.square72;
  return (
    <HStack aria-hidden xstyle={[box, styles.tile, tint]}>
      <Text xstyle={[size === 48 ? styles.glyph48 : styles.glyph72]}>
        <Glyph />
      </Text>
    </HStack>
  );
}

/** "PDF · 180 kB", "example-library.org", or nothing for a photo. */
function what(item: Shared): string | null {
  return item.detail ?? item.site ?? null;
}

function shortWhen(item: Shared): string {
  return item.day === 'Today' ? item.time : item.day === 'Yesterday' ? 'Yesterday' : 'Oct 6';
}

function row(item: Shared, description: string, size: 48 | 72, value?: string): MenuItem {
  return {
    id: item.id,
    label: item.title,
    icon: <Preview item={item} size={size} />,
    description,
    ...(value ? { value } : {}),
    onSelect: () => {},
  };
}

function Page({ children }: { readonly children: ReactNode }) {
  return (
    <SubPage title="Stuff shared" backHref="#" backLabel="Back to options" gap={4}>
      <VStack gap={3} xstyle={styles.list}>
        {children}
      </VStack>
    </SubPage>
  );
}

function OneList() {
  return (
    <Page>
      <MenuList
        label="Stuff shared"
        hasDividers
        items={SHARED.map((item) =>
          row(
            item,
            [what(item), item.who, item.day === 'Today' ? item.time : shortWhen(item)].filter(Boolean).join(' · '),
            48,
          ),
        )}
      />
    </Page>
  );
}

function ByDay() {
  const days = [...new Set(SHARED.map((item) => item.day))];
  return (
    <Page>
      {days.map((day) => (
        <VStack key={day} gap={1} xstyle={styles.list}>
          <Text xstyle={styles.day}>{day}</Text>
          <MenuList
            label={day}
            hasDividers
            items={SHARED.filter((item) => item.day === day).map((item) =>
              row(item, [what(item), item.who, item.time].filter(Boolean).join(' · '), 48),
            )}
          />
        </VStack>
      ))}
    </Page>
  );
}

type Filter = 'all' | 'photos' | 'documents' | 'links';
const IN: Record<Filter, (item: Shared) => boolean> = {
  all: () => true,
  photos: (item) => item.kind === 'photo',
  documents: (item) => item.kind !== 'photo' && item.kind !== 'link',
  links: (item) => item.kind === 'link',
};

function Filters() {
  const [filter, setFilter] = useState<Filter>('all');
  return (
    <Page>
      <ChoiceChips
        label="Show"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'photos', label: 'Photos' },
          { value: 'documents', label: 'Docs' },
          { value: 'links', label: 'Links' },
        ]}
      />
      <MenuList
        label="Stuff shared"
        hasDividers
        items={SHARED.filter(IN[filter]).map((item) =>
          row(item, [what(item), item.who].filter(Boolean).join(' · '), 48, shortWhen(item)),
        )}
      />
    </Page>
  );
}

function BigPreviews() {
  return (
    <Page>
      <MenuList
        label="Stuff shared"
        hasDividers
        items={SHARED.map((item) =>
          row(item, [what(item), `${item.who}, ${item.day === 'Today' ? item.time : `${item.day} ${item.time}`}`].filter(Boolean).join(' · '), 72),
        )}
      />
    </Page>
  );
}

const meta = {
  title: 'Member/Created/States/Stuff shared (mockups)',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const A_OneList: Story = { name: 'A · One list', render: () => <OneList /> };
export const B_ByDay: Story = { name: 'B · By day', render: () => <ByDay /> };
export const C_Filters: Story = { name: 'C · Filters', render: () => <Filters /> };
export const D_BiggerPreviews: Story = { name: 'D · Bigger previews', render: () => <BigPreviews /> };
