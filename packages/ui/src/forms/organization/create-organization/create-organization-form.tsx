'use client';

import { FormWrapper } from '@ferix/ui/components/forms/form-wrapper';
import { authClient } from '@ferix/ui/lib/auth-client';
import { useTranslations } from 'next-intl';
import { createOrganizationFormConfig } from './create-organization-form-config';
import { useCreateOrganizationForm } from './use-create-organization-form';

export function CreateOrganizationForm() {
  const form = useCreateOrganizationForm();
  const t = useTranslations('organization.create');

  return (
    <FormWrapper
      form={form}
      heading={t('heading')}
      subheading={t('subheading')}
    >
      <form.AppField name="name">
        {(field) => (
          <field.TextField
            label={t('name.label')}
            placeholder={t('name.placeholder')}
            textAfter={t('name.text-after')}
            type="text"
          />
        )}
      </form.AppField>
      <form.AppField
        asyncDebounceMs={createOrganizationFormConfig.slug.debounceMs}
        name="slug"
        validators={{
          onChangeAsync: async ({ value }) => {
            const response = await authClient.organization.checkSlug({
              slug: value,
            });
            if (!response.data?.status) {
              return t('slug.error.taken');
            }
          },
        }}
      >
        {(field) => (
          <field.TextField
            label={t('slug.label')}
            placeholder={t('slug.placeholder')}
            textAfter={t('slug.text-after')}
            type="text"
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label={t('submit')} />
      </form.AppForm>
    </FormWrapper>
  );
}
