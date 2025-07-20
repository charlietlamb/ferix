import { BaseDialog } from '@ferix/ui/components/dialog/base-dialog';
import { Button } from '@ferix/ui/components/shadcn/button';
import { InviteOrganizationMemberForm } from '@ferix/ui/forms/organization/invite-organization-member/invite-organization-member-form';
import { useTranslations } from 'next-intl';

export function InviteOrganizationMemberDialog({
  children,
}: {
  children?: React.ReactNode;
}) {
  const t = useTranslations('organization.invite.dialog');
  return (
    <BaseDialog
      content={<InviteOrganizationMemberForm labels={false} />}
      description={t('subheading')}
      title={t('heading')}
    >
      {children || <Button variant="outline">{t('trigger')}</Button>}
    </BaseDialog>
  );
}
