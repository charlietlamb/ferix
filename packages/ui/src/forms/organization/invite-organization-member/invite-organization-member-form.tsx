'use client';

import { getUserRoleLabel } from '@ferix/types/organizations/user-role';
import { FormWrapper } from '@ferix/ui/components/forms/form-wrapper';
import { useTranslations } from 'next-intl';
import { useInviteOrganizationMemberForm } from './use-invite-organization-member-form';

export function InviteOrganizationMemberForm({
  labels = true,
  onSuccess,
}: {
  labels?: boolean;
  onSuccess?: () => void;
}) {
  const form = useInviteOrganizationMemberForm({ onSuccess });
  const t = useTranslations('organization.invite.form');
  const tRole = useTranslations('organization.role');
  const roleLabels = getUserRoleLabel(tRole);

  return (
    <FormWrapper
      form={form}
      heading={t('heading')}
      labels={labels}
      subheading={t('subheading')}
    >
      <form.AppField name="email">
        {(field) => (
          <field.TextField
            label={t('email.label')}
            placeholder={t('email.placeholder')}
            type="email"
          />
        )}
      </form.AppField>
      <form.AppField name="role">
        {(field) => (
          <field.SelectField
            label={t('role.label')}
            options={Object.entries(roleLabels).map(([value, label]) => ({
              label,
              value,
            }))}
            placeholder={t('role.placeholder')}
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label={t('submit')} />
      </form.AppForm>
    </FormWrapper>
  );
}
