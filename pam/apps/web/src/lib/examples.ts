/**
 * When a screen may show example things (D-518).
 *
 * Will, 11 October, a launch rule: a real account sees only its real things, never
 * examples. An example person, badge or row on somebody's own Profile reads as a
 * thing that is theirs, and it is not.
 *
 * Examples are shown in exactly three places, each one an explicit mode and none of
 * them an ordinary account:
 *
 * - **A super admin previewing a role** (`demoRole`, "See the app as"): the screen says
 *   it is a preview, and an example is what a preview is for.
 * - **An account a super admin has put in demo view** (`isDemo`, 0057): that is what
 *   the setting is for.
 * - **Storybook**, where every screen is a sketch of itself.
 *
 * Everything else gets the real data and, where a list is empty, its own short empty
 * state.
 */
export function inStorybook(): boolean {
  return typeof window !== 'undefined' && '__STORYBOOK_PREVIEW__' in window;
}

export function showsExamples(options: { readonly demoRole?: string | null; readonly isDemo?: boolean }): boolean {
  return Boolean(options.demoRole) || Boolean(options.isDemo) || inStorybook();
}
