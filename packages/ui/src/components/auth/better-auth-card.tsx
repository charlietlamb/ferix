'use client'

import { AuthCard, AuthCardProps } from '@daveyplate/better-auth-ui'

export const BetterAuthCard = (props: AuthCardProps) => {
  return (
    <AuthCard
      className="max-w-xl"
      classNames={{
        separator: 'flex-1',
      }}
      socialLayout="horizontal"
      {...props}
    />
  )
}
