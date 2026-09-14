'use client';

import * as stylex from '@stylexjs/stylex';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { pam } from './tokens.stylex.js';

/**
 * Which role's screen a super admin is looking at.
 *
 * PAM is one codebase serving four very different people, and the person
 * running it has to be able to see what each of them sees — a case manager
 * reporting that "the tile is missing" is describing a screen the super admin
 * has never had (Will, 14 September). So the role chip in the header, which was
 * a label, becomes the control that switches it.
 *
 * **It changes the screen, never the data.** Choosing "Member" renders the
 * member's arrangement of the super admin's own account: their saved places,
 * their points, their notifications. It is not impersonation and cannot become
 * it — every query still runs as the signed-in person under the same row-level
 * rules, and the database has no idea this control exists. A tool that let
 * staff read a member's screen as that member would be a different thing
 * entirely, and would have to be argued for on its own terms, in front of the
 * people it is about.
 *
 * The chip says so while it is switched: "Viewing as Member", not "Member". A
 * super admin who forgets which mode they are in and files a bug about a
 * missing screen costs an afternoon; one who forgets and believes they are
 * seeing somebody's data costs trust.
 */
export interface RoleSwitchProps {
  /** The role being viewed, which may not be the signed-in role. */
  readonly value: string;
  /** Options as `{ value, label }`, already localised and ordered. */
  readonly options: readonly { readonly value: string; readonly label: string }[];
  /** The control's accessible name, e.g. "Switch the view". */
  readonly label: string;
  /** What the trigger reads when a role other than their own is selected. */
  readonly viewingLabel: (roleLabel: string) => string;
  /** The signed-in person's own role, so "their own screen" can be named. */
  readonly ownValue: string;
  readonly onChange: (value: string) => void;
}

const styles = stylex.create({
  trigger: {
    minHeight: pam.touchTargetMin,
    fontSize: '15px',
    // A chip, not a button: it sits beside a wordmark and must not look like
    // the screen's action.
    borderRadius: '999px',
  },
});

export function RoleSwitch({
  value,
  options,
  label,
  viewingLabel,
  ownValue,
  onChange,
}: RoleSwitchProps) {
  const current = options.find((option) => option.value === value);
  const isOwn = value === ownValue;
  const text = current ? (isOwn ? current.label : viewingLabel(current.label)) : label;

  return (
    <DropdownMenu
      button={{ label: text, variant: 'secondary', xstyle: styles.trigger }}
      presentation="adaptive"
      placement="below"
      alignment="start"
      items={options.map((option) => ({
        id: option.value,
        label: option.label,
        onClick: () => onChange(option.value),
      }))}
    />
  );
}
