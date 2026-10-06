'use client';

import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { Dialog } from '@astryxdesign/core/Dialog';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton } from '@pam/ui';

/**
 * "Are you sure?", the one way Pam asks it (D-234, D-255): 32px corners over
 * the page washed to 80% white (`data-pam-dialog`, globals.css), a plain
 * question, the action as the one big button, and a quiet way not to.
 * Closing it any other way — the backdrop, Escape — is the quiet way.
 *
 * `secondary` is for the rare question with two real answers besides "not
 * now": leaving Saved with removals waiting asks Remove, or Put back.
 */
const styles = stylex.create({
  title: { fontSize: '22px', lineHeight: 1.3 },
  body: { fontSize: '17px', lineHeight: 1.45 },
});

export interface ConfirmDialogProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly body?: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
  readonly cancelLabel: string;
  readonly onCancel: () => void;
  readonly secondary?: { readonly label: string; readonly onPress: () => void };
}

export function ConfirmDialog({
  isOpen,
  title,
  body,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
  secondary,
}: ConfirmDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      width={360}
      padding={6}
      data-pam-dialog="confirm"
    >
      <VStack gap={4}>
        <Heading level={2} xstyle={styles.title}>
          {title}
        </Heading>
        {body ? (
          <Text type="supporting" xstyle={styles.body}>
            {body}
          </Text>
        ) : null}
        <VStack gap={2}>
          <BigButton label={confirmLabel} onPress={onConfirm} />
          {secondary ? <BigButton label={secondary.label} variant="secondary" onPress={secondary.onPress} /> : null}
          <Button label={cancelLabel} variant="ghost" onClick={onCancel} />
        </VStack>
      </VStack>
    </Dialog>
  );
}
