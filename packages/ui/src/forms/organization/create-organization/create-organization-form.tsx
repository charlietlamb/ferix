'use client'

import { useTranslations } from 'next-intl'
import { useCreateOrganizationForm } from './use-create-organization-form'
import { FormWrapper } from '@ferix/ui/components/forms/form-wrapper'

export function CreateOrganizationForm() {
  const form = useCreateOrganizationForm()
  const t = useTranslations('organization.create')

  return (
    <FormWrapper heading={t('heading')} subheading={t('subheading')}>
      <form.AppField
        name="name"
        children={(field) => (
          <field.TextField
            label={t('name.label')}
            type="text"
            placeholder={t('name.placeholder')}
            textAfter={t('name.textAfter')}
          />
        )}
      />
      <form.AppField
        name="slug"
        children={(field) => (
          <field.TextField
            label={t('slug.label')}
            type="text"
            placeholder={t('slug.placeholder')}
            textAfter={t('slug.textAfter')}
          />
        )}
      />
      <form.AppForm>
        <form.SubmitButton label={t('submit')} />
      </form.AppForm>
    </FormWrapper>
  )
}
