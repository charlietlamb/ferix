'use client'

import { useTranslations } from 'next-intl'
import { useCreateOrganizationForm } from './use-create-organization-form'
import { FormWrapper } from '@ferix/ui/components/forms/form-wrapper'
import { authClient } from '@ferix/ui/lib/auth-client'
import { createOrganizationFormConfig } from './create-organization-form-config'

export function CreateOrganizationForm() {
  const form = useCreateOrganizationForm()
  const t = useTranslations('organization.create')

  return (
    <FormWrapper
      form={form}
      heading={t('heading')}
      subheading={t('subheading')}
    >
      <form.AppField
        name="name"
        children={(field) => (
          <field.TextField
            label={t('name.label')}
            type="text"
            placeholder={t('name.placeholder')}
            textAfter={t('name.text-after')}
          />
        )}
      />
      <form.AppField
        name="slug"
        asyncDebounceMs={createOrganizationFormConfig.slug.debounceMs}
        validators={{
          onChangeAsync: async ({ value }) => {
            const response = await authClient.organization.checkSlug({
              slug: value,
            })
            if (!response.data?.status) {
              return t('slug.error.taken')
            }
          },
        }}
        children={(field) => (
          <field.TextField
            label={t('slug.label')}
            type="text"
            placeholder={t('slug.placeholder')}
            textAfter={t('slug.text-after')}
          />
        )}
      />
      <form.AppForm>
        <form.SubmitButton label={t('submit')} />
      </form.AppForm>
    </FormWrapper>
  )
}
