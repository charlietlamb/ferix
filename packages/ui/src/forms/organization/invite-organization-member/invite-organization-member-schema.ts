import { UserRole } from '@ferix/types/organizations/user-role';
import type { useTranslations } from 'next-intl';
import { z } from 'zod';

export const getInviteOrganizationMemberSchema = (
  t: ReturnType<typeof useTranslations>
) =>
  z.object({
    email: z.email({ message: t('email.error.invalid') }),
    role: z.enum(Object.values(UserRole), {
      message: t('role.error.invalid'),
    }),
  });

export type InviteOrganizationMemberSchema = z.infer<
  ReturnType<typeof getInviteOrganizationMemberSchema>
>;
