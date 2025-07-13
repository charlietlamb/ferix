'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@ferix/ui/components/shadcn/breadcrumb'
import { cn } from '@ferix/ui/lib/utils'
import { usePathname } from 'next/navigation'

export function DashboardBreadcrumbs() {
  let pathname = usePathname()
  const segments: { label: string; href: string }[] = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index) => {
      return {
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: `/${segments.slice(0, index + 1).join('/')}`,
      }
    })

  segments.unshift({
    label: 'Dashboard',
    href: '/',
  })

  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    const isLast = index === segments.length - 1

    return (
      <BreadcrumbItem
        key={href}
        className={cn('hidden md:block', isLast && 'text-foreground')}
      >
        <BreadcrumbLink href={segment.href}>{segment.label}</BreadcrumbLink>
      </BreadcrumbItem>
    )
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>{breadcrumbs}</BreadcrumbList>
    </Breadcrumb>
  )
}
