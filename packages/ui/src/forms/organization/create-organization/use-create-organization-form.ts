import { useRouter } from '@ferix/i18n/navigation';
import { useAppForm } from '@ferix/ui/hooks/form';
import { authClient } from '@ferix/ui/lib/auth-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  type CreateOrganizationSchema,
  getCreateOrganizationSchema,
} from './create-organization-schema';

export function useCreateOrganizationForm() {
  const router = useRouter();
  const t = useTranslations('organization.create');
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
      });
      if (response.error) {
        toast.error(response.error.message);
      }
      router.refresh();
    },
  });
}
