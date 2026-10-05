/*
 * How a caseload row describes a person — moved out of `/admin/` so the
 * case manager's redesigned home (D-212) says it the same way.
 */

/**
 * What the status chip should say.
 *
 * "Some things turned off" is the member's wording, and on a caseload it
 * answers nothing: off how, and which? A case manager needs the specifics,
 * because the next thing they do is either explain it or undo it. Beyond two
 * features the names stop fitting a chip, so it becomes a count and the detail
 * moves to the member's own screen.
 */
export function statusChip(
  member: { accessStatus: string; featuresOff: string[] },
  t: (key: string, vars?: Record<string, string | number>) => string,
): { label: string; tone: 'error' | 'warning' } | null {
  if (member.accessStatus === 'suspended') {
    return { label: t('admin.status.suspended'), tone: 'error' };
  }
  if (member.accessStatus !== 'limited') return null;

  const names = member.featuresOff.map((f) => t(`feature.${f}`));
  if (names.length === 0) return { label: t('admin.status.limited'), tone: 'warning' };
  if (names.length <= 2) {
    return { label: t('admin.status.off', { features: names.join(', ') }), tone: 'warning' };
  }
  return { label: t('admin.status.offCount', { count: names.length }), tone: 'warning' };
}

export function whenLastActive(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso));
}

/** The simpler chip a dummy row gets — no `featuresOff` to explain, unlike a real one. */
export function dummyChip(
  accessStatus: string,
  t: (key: string) => string,
): { label: string; tone: 'error' | 'warning' } | null {
  if (accessStatus === 'suspended') return { label: t('admin.status.suspended'), tone: 'error' };
  if (accessStatus === 'limited') return { label: t('admin.status.limited'), tone: 'warning' };
  return null;
}
