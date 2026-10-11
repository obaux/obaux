/** A heading as an id: lower case, letters and numbers, dashes. "Who’s it for?" -> "whos-it-for". */
export function sectionId(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

