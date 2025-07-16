import {
  CreateOrganizationSchema,
  createOrganizationSchema,
} from './create-organization-schema'
import { useAppForm } from '@ferix/ui/hooks/form'

export function useCreateOrganizationForm() {
  return useAppForm({
    defaultValues: {
      name: '',
      slug: '',
    } satisfies CreateOrganizationSchema,
    validators: {
      onSubmit: createOrganizationSchema,
    },
  })
}
