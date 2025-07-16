import { authClient } from '@ferix/ui/lib/auth-client'
import {
  CreateOrganizationSchema,
  createOrganizationSchema,
} from './create-organization-schema'
import { useAppForm } from '@ferix/ui/hooks/form'
import { useRouter } from 'next/navigation'

export function useCreateOrganizationForm() {
  const router = useRouter()
  return useAppForm({
    defaultValues: {
      name: '',
      slug: '',
    } satisfies CreateOrganizationSchema,
    validators: {
      onSubmit: createOrganizationSchema,
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
