import { useRouter } from '@ferix/i18n/navigation';
import { UserRole } from '@ferix/types/organizations/user-role';
import { useAppForm } from '@ferix/ui/hooks/form';
import { authClient } from '@ferix/ui/lib/auth-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { InviteOrganizationMemberSchema } from './invite-organization-member-schema';
import { getInviteOrganizationMemberSchema } from './invite-organization-member-schema';

export function useInviteOrganizationMemberForm() {
  const router = useRouter();
  const t = useTranslations('organization.invite.form');
  return useAppForm({
    defaultValues: {
      email: '',
      role: UserRole.MEMBER as UserRole,
    } satisfies InviteOrganizationMemberSchema,
    validators: {
      onChange: getInviteOrganizationMemberSchema(t),
      onSubmit: getInviteOrganizationMemberSchema(t),
    },
    onSubmit: async (values) => {
      const response = await authClient.organization.inviteMember({
        email: values.value.email,
        role: values.value.role,
      });
      if (response.error) {
        toast.error(response.error.message);
      }
      router.refresh();
    },
  });
}
