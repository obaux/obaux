'use client';

import { Button } from '@pam/ui/Button';
import { StackBanner, bannerAction } from './StackBanner';

/**
 * The banner a failed save, switch or send raises (D-618; Will, 19 October). Astryx's `Banner` in red, as every alert is (D-621): see `StackBanner`.
 * It has a close (it is a one-off, and goes by itself at the next tap, a good retry or leaving the screen), and the way out as its actions.
 */
export interface MalfunctionBannerAction {
  readonly label: string;
  readonly onPress: () => void;
}

export interface MalfunctionBannerProps {
  readonly title: string;
  readonly body?: string | undefined;
  readonly actions: readonly MalfunctionBannerAction[];
  readonly onClose: () => void;
}

export function MalfunctionBanner({ title, body, actions, onClose }: MalfunctionBannerProps) {
  return (
    <StackBanner
      failure
      title={title}
      description={body}
      onClose={onClose}
      actions={
        actions.length > 0 ? (
          actions.map((action) => (
            <Button key={action.label} label={action.label} variant="ghost" size="sm" onClick={action.onPress} xstyle={bannerAction} />
          ))
        ) : undefined
      }
    />
  );
}
