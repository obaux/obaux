'use client';

import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { PeopleIcon } from './icons.js';

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
 * **An icon now, not a label chip** (Will, 16 September: "should be much
 * smaller, it's taking up too much real estate... similar to what we did with
 * locale dropdown on sign in"). It used to spell out "Viewing as Member" in
 * full on the trigger itself, which was the clearest possible statement of
 * "you are not looking at your own screen" but cost a header's worth of width
 * doing it — on every screen, for the one person who can ever see it. The
 * open menu still marks the current selection with a leading check, so
 * nothing about *knowing which mode you're in* was given up, only the
 * permanently-spelled-out trigger text. The icon's own accessible name still
 * carries the full sentence via `label`.
 *
 * Built on `DropdownMenu`'s plain `items` array rather than its
 * `DropdownMenuRadioGroup`/`DropdownMenuRadioItem` compound components on
 * purpose: this file is dynamically imported from eleven different screens
 * now (Will, 16 September: "should be present on all views"), all through
 * one shared chunk, and pulling in the radio-group code specifically —
 * unused by anything else this app dynamically imports — got that chunk
 * promoted into the bundle every screen loads up front, §12's Home budget
 * included, rather than staying deferred to the one role that ever opens it.
 * A leading check character in the label does the same job the radio dot
 * did, at none of that cost.
 */
export interface RoleSwitchProps {
  /** The role being viewed, which may not be the signed-in role. */
  readonly value: string;
  /** Options as `{ value, label }`, already localised and ordered. */
  readonly options: readonly { readonly value: string; readonly label: string }[];
  /** The control's accessible name, e.g. "Switch the view". Combined with the current selection for the trigger's own name. */
  readonly label: string;
  /** What the trigger's accessible name adds when a role other than their own is selected. */
  readonly viewingLabel: (roleLabel: string) => string;
  /** The signed-in person's own role, so "their own screen" can be named. */
  readonly ownValue: string;
  readonly onChange: (value: string) => void;
}

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
  const accessibleName = current
    ? `${label}: ${isOwn ? current.label : viewingLabel(current.label)}`
    : label;

  return (
    <DropdownMenu
      button={{ label: accessibleName, icon: <PeopleIcon />, isIconOnly: true, variant: 'ghost' }}
      hasChevron={false}
      placement="below"
      alignment="start"
      items={options.map((option) => ({
        id: option.value,
        label: option.label,
        onClick: () => onChange(option.value),
        // A trailing check rather than `DropdownMenuRadioGroup`'s own
        // indicator — see the file comment on why this stays off it.
        endContent: option.value === value ? '✓' : undefined,
      }))}
    />
  );
}
