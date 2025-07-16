import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+$/)
    .max(255),
})

export type CreateOrganizationSchema = z.infer<typeof createOrganizationSchema>
