import { waitFor } from 'storybook/test';

/**
 * Bring one slide of the on-screen carousel into view, the way a swipe does (stories only).
 *
 * A carousel shows one slide at a time, and the other two are scrolled away, so a story that
 * loads on the first slide shows (and the language-fit audit measures) only that one. The staff
 * welcome lines on slides 2 and 3 (`onboarding.admin.2`, `onboarding.provider.3`) were never
 * drawn by any story. This scrolls the same container `OnboardingSlides` scrolls itself, with
 * the same right-to-left sign, so Arabic lands on the right slide too.
 */
export async function showSlide(canvasElement: HTMLElement, index: number): Promise<void> {
  const slide = await waitFor(() => {
    const found = canvasElement.querySelector<HTMLElement>(`[data-slide="${index}"]`);
    if (!found) throw new Error(`no slide ${index} yet`);
    return found;
  });
  // Two levels above a slide: `Carousel`'s own group wrapper, then the scroller (as `OnboardingSlides` finds it).
  const scroller = slide.parentElement?.parentElement;
  if (!scroller) throw new Error('slide has no scroller');
  const sign = getComputedStyle(scroller).direction === 'rtl' ? -1 : 1;
  scroller.scrollLeft = sign * index * scroller.clientWidth;
}

/** Choose a tab of About Pam by its value (`member`, `admin`, `provider`), whatever language it is drawn in. */
export async function chooseAboutTab(canvasElement: HTMLElement, who: 'member' | 'admin' | 'provider'): Promise<void> {
  const tab = await waitFor(() => {
    const found = canvasElement.querySelector<HTMLElement>(`[role="radio"][data-value="${who}"]`);
    if (!found) throw new Error(`no ${who} tab yet`);
    return found;
  });
  tab.click();
  // The carousel under the tabs is keyed by the tab, so it is a new one (back on its first slide) once this
  // tab is the chosen one; scrolling before that would scroll the one that is about to go.
  await waitFor(() => {
    if (tab.getAttribute('aria-checked') !== 'true') throw new Error(`${who} tab not chosen yet`);
  });
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
}
