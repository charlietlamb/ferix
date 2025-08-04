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
import { cn } from '@ferix/ui/lib/utils';
import { Book, CpuIcon, Gauge, MessageCircle, Users } from 'lucide-react';
import Link from 'next/link';

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
          title: 'Chat',
          url: '/chat',
          icon: MessageCircle,
        },
        {
          title: 'Organization',
          url: '/organization',
          icon: Users,
        },
        {
          title: 'Knowledge Base',
          url: '/knowledge-base',
          icon: Book,
        },
      ],
    },
  ],
};

function SidebarLogo() {
  const { open, openMobile } = useSidebar();
  return (
    <div className="flex gap-2 px-2 transition-[padding] duration-200 ease-in-out group-data-[collapsible=icon]:px-0">
      <Link
        className={cn(
          'group/logo inline-flex w-full items-center justify-center gap-1 text-base text-muted-foreground',
          open && 'w-auto'
        )}
        href="/"
      >
        <CpuIcon strokeWidth={1.5} />
        {(open || openMobile) && (
          <span className="truncate font-medium font-mono">Ferix AI</span>
        )}
      </Link>
    </div>
  );
}

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { open, openMobile } = useSidebar();
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
                      className={cn(
                        'group/menu-button h-9 gap-3 font-medium data-[active=true]:border group-data-[collapsible=icon]:px-[5px]! [&>svg]:size-auto'
                      )}
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
              base: ' cursor-pointer',
            },
            content: {
              menuItem: 'cursor-pointer',
            },
          }}
          size={open || openMobile ? 'default' : 'icon'}
        />
      </SidebarFooter>
      <SidebarRail className="hover:after:bg-sidebar-transparent" />
    </Sidebar>
  );
}
