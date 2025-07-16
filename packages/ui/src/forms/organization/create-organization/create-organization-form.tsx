'use client'

import { useTranslations } from 'next-intl'
import { useCreateOrganizationForm } from './use-create-organization-form'

export function CreateOrganizationForm() {
  const form = useCreateOrganizationForm()
  const t = useTranslations('organization.create')

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl">
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
    </div>
  )
}
