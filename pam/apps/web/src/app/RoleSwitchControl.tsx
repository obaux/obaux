'use client';

import { ROLES, type Role } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { RoleSwitchLazy } from './RoleSwitchLazy';

/**
 * The compact `RoleSwitch`, wired up the same way on every screen that shows
 * it — Home already had this wiring inline; this is that same shape, shared,
 * so the other nine screens that gate on a viewed role (Will, 16 September:
 * "should be present on all views") did not each need to retype it.
 *
 * `null` when there is nobody to preview as — a super admin looking at their
 * own real screen still gets the control (so they can start a preview), a
 * signed-out or non-super-admin visitor gets nothing.
 */
export function RoleSwitchControl({
  trueRole,
  viewedRole,
  onChange,
}: {
  readonly trueRole: Role | null;
  readonly viewedRole: Role | null;
  readonly onChange: (role: Role) => void;
}) {
  const { t } = useI18n();
  if (trueRole !== 'super_admin' || !viewedRole) return null;

  return (
    <RoleSwitchLazy
      value={viewedRole}
      ownValue={trueRole}
      label={t('view.switch')}
      viewingLabel={(roleLabel) => t('view.as', { role: roleLabel })}
      options={ROLES.map((role) => ({ value: role, label: t(`role.${role}`) }))}
      onChange={(next) => onChange(next as Role)}
    />
  );
}
