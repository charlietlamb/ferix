import { BaseDialog } from '@ferix/ui/components/dialog/base-dialog';
import { InviteOrganizationMemberForm } from '@ferix/ui/forms/organization/invite-organization-member/invite-organization-member-form';
import { useTranslations } from 'next-intl';

export function InviteOrganizationMemberDialog() {
  const t = useTranslations('organization.invite.dialog');
  return (
    <BaseDialog
      description={t('subheading')}
      modalKey="inviteOrganizationMember"
      title={t('heading')}
    >
      <InviteOrganizationMemberForm labels={false} />
    </BaseDialog>
  );
}
