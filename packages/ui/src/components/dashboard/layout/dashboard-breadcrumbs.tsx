'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@ferix/ui/components/shadcn/breadcrumb'
import { cn } from '@ferix/ui/lib/utils'
import { Fragment } from 'react'
import { usePathname } from 'next/navigation'

export function DashboardBreadcrumbs() {
  let pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)

  const segments: { label: string; href: string }[] = pathSegments.map(
    (segment, index) => {
      return {
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: `/${pathSegments.slice(0, index + 1).join('/')}`,
      }
    }
  )

  segments.unshift({
    label: 'Dashboard',
    href: '/',
  })

  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    const isLast = index === segments.length - 1

    return (
      <Fragment key={href}>
        <BreadcrumbItem
          className={cn('hidden md:block', isLast && 'text-foreground')}
        >
          <BreadcrumbLink href={segment.href}>{segment.label}</BreadcrumbLink>
        </BreadcrumbItem>
        {!isLast && <BreadcrumbSeparator />}
      </Fragment>
    )
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>{breadcrumbs}</BreadcrumbList>
    </Breadcrumb>
  )
}
