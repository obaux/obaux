import { isValidElement, type ReactNode } from 'react';
import { Section } from '../components/Prose';
import { sectionLabel } from './section-label';
import { sectionId } from './slug';

/** A section of a post, as the "On this page" menu lists it. */
export interface PostSection {
  /** The id of the heading's section on the page (`#id`). */
  readonly id: string;
  /** The short label the menu shows. */
  readonly label: string;
}

/** The id and label of the closing "Still stuck?" card, which ends every post. */
export const STILL_STUCK: PostSection = { id: 'still-stuck', label: 'Still stuck?' };

/**
 * The sections of a post, read from the element its body returns: every `<Section title short?>`, in
 * order. Done in the page's own render (no DOM), so the menu is in the first paint and the build can test it.
 * A section built inside another component of the body is not seen here; the menu then finds it in the page
 * after it loads (`PostNav`). The label is the section's own `short`, else Sage's label for that post and title
 * (`section-labels.ts`), else the full title.
 */
export function collectSections(node: ReactNode, slug?: string): PostSection[] {
  const out: PostSection[] = [];
  const seen = new Set<string>();
  const walk = (n: ReactNode): void => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!isValidElement(n)) return;
    const props = n.props as { title?: unknown; short?: unknown; children?: ReactNode };
    if (n.type === Section && typeof props.title === 'string') {
      const id = sectionId(props.title);
      if (!seen.has(id)) {
        seen.add(id);
        out.push({ id, label: sectionLabel(slug, props.title, typeof props.short === 'string' ? props.short : undefined) });
      }
      return;
    }
    walk(props.children);
  };
  walk(node);
  return out;
}
