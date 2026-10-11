import { SECTION_LABELS } from '../content/section-labels';

/** The label the "On this page" menu shows for a section: its own short one, else Sage's for that post, else the heading. */
export function sectionLabel(slug: string | undefined, title: string, own?: string): string {
  return own || (slug ? SECTION_LABELS[slug]?.[title] : undefined) || title;
}
