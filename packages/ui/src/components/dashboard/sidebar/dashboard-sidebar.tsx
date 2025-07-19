'use client';

import { UserButton } from '@daveyplate/better-auth-ui';
import { usePathname, useRouter } from '@ferix/i18n/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@ferix/ui/components/shadcn/sidebar';
import { Gauge, Users, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

const data = {
  navMain: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: Gauge,
        },
        {
          title: 'Subscriptions',
          url: '/subscriptions',
          icon: WalletCards,
        },
        {
          title: 'Organization',
          url: '/organization',
          icon: Users,
        },
      ],
    },
  ],
};

function SidebarLogo() {
  const id = useId();
  const t = useTranslations('sidebar');
  return (
    <div className="flex gap-2 px-2 transition-[padding] duration-200 ease-in-out group-data-[collapsible=icon]:px-0">
      <Link className="group/logo inline-flex" href="/">
        <span className="sr-only">Logo</span>
        <svg
          className="size-9 transition-[width,height] duration-200 ease-in-out group-data-[collapsible=icon]:size-8"
          height="36"
          viewBox="0 0 36 36"
          width="36"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>{t('logo')}</title>
          <path
            clipRule="evenodd"
            d="M12.972 2a6.806 6.806 0 0 0-4.813 1.993L2 10.153v2.819c0 1.991.856 3.783 2.22 5.028A6.788 6.788 0 0 0 2 23.028v2.82l6.16 6.159A6.806 6.806 0 0 0 18 31.78a6.806 6.806 0 0 0 9.841.226L34 25.847v-2.819A6.788 6.788 0 0 0 31.78 18 6.788 6.788 0 0 0 34 12.972v-2.82l-6.159-6.159A6.806 6.806 0 0 0 18 4.22 6.788 6.788 0 0 0 12.972 2Zm9.635 16a6.741 6.741 0 0 1-.226-.216L18 13.403l-4.381 4.381a6.741 6.741 0 0 1-.226.216c.077.07.152.142.226.216L18 22.597l4.381-4.381c.074-.074.15-.146.226-.216Zm-2.83 7.848v1.346a3.25 3.25 0 0 0 5.55 2.298l5.117-5.117v-1.347a3.25 3.25 0 0 0-5.549-2.298l-5.117 5.117Zm-3.555 0-5.117-5.118a3.25 3.25 0 0 0-5.55 2.298v1.347l5.118 5.117a3.25 3.25 0 0 0 5.55-2.298v-1.346Zm0-17.042v1.347l-5.117 5.117a3.25 3.25 0 0 1-5.55-2.298v-1.347l5.118-5.117a3.25 3.25 0 0 1 5.55 2.298Zm8.673 6.464-5.117-5.117V8.806a3.25 3.25 0 0 1 5.549-2.298l5.117 5.117v1.347a3.25 3.25 0 0 1-5.549 2.298Z"
            fill={`url(#${id})`}
            fillRule="evenodd"
          />
          <defs>
            <linearGradient
              gradientUnits="userSpaceOnUse"
              id={id}
              x1="18"
              x2="18"
              y1="2"
              y2="34"
            >
              <stop stopColor="#F4F4F5" />
              <stop offset="1" stopColor="#A1A1AA" />
            </linearGradient>
          </defs>
        </svg>
      </Link>
    </div>
  );
}

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader className="mb-2 h-16 justify-center max-md:mt-2">
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent className="-mt-2">
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="text-muted-foreground/65 uppercase">
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((menuItem) => (
                  <SidebarMenuItem key={menuItem.title}>
                    <SidebarMenuButton
                      asChild
                      className="group/menu-button h-9 gap-3 font-medium group-data-[collapsible=icon]:px-[5px]! [&>svg]:size-auto"
                      isActive={menuItem.url === pathname}
                      onClick={() => {
                        router.push(menuItem.url);
                      }}
                      tooltip={menuItem.title}
                    >
                      <a href={menuItem.url}>
                        {menuItem.icon && (
                          <menuItem.icon
                            aria-hidden="true"
                            className="text-muted-foreground/65 group-data-[active=true]/menu-button:text-primary"
                            size={22}
                          />
                        )}
                        <span>{menuItem.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <UserButton
          classNames={{
            trigger: {
              base: 'bg-transparent hover:bg-foreground/10 cursor-pointer',
            },
            content: {
              menuItem: 'cursor-pointer',
            },
          }}
          size={open ? 'default' : 'icon'}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
