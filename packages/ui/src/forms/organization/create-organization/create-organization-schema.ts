import { z } from 'zod'
import { useTranslations } from 'next-intl'

export const getCreateOrganizationSchema = (
  t: ReturnType<typeof useTranslations>
) =>
  z.object({
    name: z
      .string()
      .min(1, { message: t('name.error.min') })
      .max(255, {
        message: t('name.error.max'),
      }),
    slug: z
      .string()
      .min(1, { message: t('slug.error.min') })
      .regex(/^[a-z0-9-]+$/, { message: t('slug.error.regex') })
      .max(255, { message: t('slug.error.max') }),
  })

export type CreateOrganizationSchema = z.infer<
  ReturnType<typeof getCreateOrganizationSchema>
>
