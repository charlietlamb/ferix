import type { ValueOf } from '@ferix/types/value-of';
import type { useTranslations } from 'next-intl';

export const UserRole = {
  MEMBER: 'member',
  ADMIN: 'admin',
  OWNER: 'owner',
} as const;

export type UserRole = ValueOf<typeof UserRole>;

export function getUserRoleLabel(t: ReturnType<typeof useTranslations>) {
  return {
    [UserRole.MEMBER]: t('member'),
    [UserRole.ADMIN]: t('admin'),
    [UserRole.OWNER]: t('owner'),
  };
}
