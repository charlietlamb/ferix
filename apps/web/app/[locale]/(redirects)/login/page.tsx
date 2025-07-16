import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'

export default async function () {
  const locale = await getLocale()
  redirect({ href: '/auth/sign-in', locale })
}
