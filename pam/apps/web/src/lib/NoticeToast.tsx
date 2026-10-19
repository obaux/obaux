'use client';

import { Button } from '@pam/ui/Button';
import { HelpIcon } from '@pam/ui/icons';
import type { NoticeToastSpec } from '@pam/ui/noticeSink';
import { StackBanner, bannerAction } from './StackBanner';

/**
 * One status `Notice` as Astryx's `Banner` in red (D-621; Will, 19 October: "The blue variant (but in red) is the style of alert banner I want to
 * use across the entire app."), at the bottom of the screen in the one stack with the failure banner (D-618). What is in it is what the `Notice`
 * card said: the title, the line, "Try again" and "Contact Pam" as 48px controls. `userFacingNote` has already replaced the body before it gets
 * here, and the internal reason never does. Contact Pam takes the same quiet button.
 *
 * A state that lasts has no close and there is no swipe: it goes when the state ends (the `Notice` unmounts). A one-off has a close.
 * Every alert is `role="alert"` (that is the `Banner`'s), the calm states included.
 */
export function NoticeToast({ spec, onClose }: { readonly spec: NoticeToastSpec; readonly onClose: () => void }) {
  const buttons = [
    spec.retry ? <Button key="retry" label={spec.retry.label} variant="ghost" size="sm" clickAction={spec.retry.onPress} xstyle={bannerAction} /> : null,
    spec.contact ? <Button key="contact" label={spec.contact.label} variant="ghost" size="sm" href={spec.contact.href} icon={<HelpIcon />} xstyle={bannerAction} /> : null,
  ].filter((button) => button !== null);
  return (
    <StackBanner
      title={spec.title}
      description={spec.body}
      {...(spec.closable ? { onClose } : {})}
      actions={buttons.length > 0 ? buttons : undefined}
    />
  );
}
