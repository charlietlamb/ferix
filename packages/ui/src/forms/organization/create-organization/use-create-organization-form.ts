import { authClient } from '@ferix/ui/lib/auth-client'
import {
  CreateOrganizationSchema,
  getCreateOrganizationSchema,
} from './create-organization-schema'
import { useAppForm } from '@ferix/ui/hooks/form'
import { useRouter } from '@ferix/i18n/navigation'
import { useTranslations } from 'next-intl'

export function useCreateOrganizationForm() {
  const router = useRouter()
  const t = useTranslations('organization.create')
  return useAppForm({
    defaultValues: {
      name: '',
      slug: '',
    } satisfies CreateOrganizationSchema,
    validators: {
      onChange: getCreateOrganizationSchema(t),
      onSubmit: getCreateOrganizationSchema(t),
    },
    onSubmit: async (values) => {
      const response = await authClient.organization.create({
        name: values.value.name,
        slug: values.value.slug,
      })
      if (response.error) {
        console.log('TODO: global error handling')
        console.log(response.error)
      }
      router.refresh()
    },
  })
}
