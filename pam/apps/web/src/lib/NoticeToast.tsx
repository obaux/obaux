'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Button } from '@pam/ui/Button';
import { HelpIcon } from '@pam/ui/icons';
import type { NoticeToastSpec } from '@pam/ui/noticeSink';
import { StackBanner } from './StackBanner';

/**
 * One status `Notice` as Astryx's `Banner` in red (D-621; Will, 19 October: "The blue variant (but in red) is the style of alert banner I want to
 * use across the entire app."), at the bottom of the screen in the one stack with the failure banner (D-618). What is in it is what the `Notice`
 * card said: the title, the line, "Try again" and "Contact Pam" as 48px controls. `userFacingNote` has already replaced the body before it gets
 * here, and the internal reason never does. Contact Pam is a link when `quiet` (D-432).
 *
 * A state that lasts has no close and there is no swipe: it goes when the state ends (the `Notice` unmounts). A one-off has a close.
 * Every alert is `role="alert"` (that is the `Banner`'s), the calm states included.
 */
export function NoticeToast({ spec, onClose }: { readonly spec: NoticeToastSpec; readonly onClose: () => void }) {
  return (
    <StackBanner
      title={spec.title}
      description={spec.body}
      {...(spec.closable ? { onClose } : {})}
      actions={
        spec.retry || spec.contact ? (
          <HStack gap={1} wrap="wrap" align="center">
            {spec.retry ? <Button label={spec.retry.label} variant="secondary" clickAction={spec.retry.onPress} /> : null}
            {spec.contact ? (
              <Button
                label={spec.contact.label}
                variant={spec.quiet ? 'ghost' : 'secondary'}
                href={spec.contact.href}
                icon={<HelpIcon />}
              />
            ) : null}
          </HStack>
        ) : undefined
      }
    />
  );
}
