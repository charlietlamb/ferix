'use client';

import { usePathname, useRouter } from '@ferix/i18n/navigation';
import { Tabs, TabsList, TabsTrigger } from '@ferix/ui/components/shadcn/tabs';
import { BoxIcon, HouseIcon, UserIcon } from 'lucide-react';

type Tab = {
  label: string;
  value: string;
  icon: React.ReactNode;
  route: string;
};

const iconProps = {
  'aria-hidden': true,
  className: '-ms-0.5 me-1.5 opacity-60',
  size: 24,
};

const tabs: Tab[] = [
  {
    label: 'Overview',
    value: 'overview',
    icon: <HouseIcon {...iconProps} />,
    route: '',
  },
  {
    label: 'Organization',
    value: 'organization',
    icon: <BoxIcon {...iconProps} />,
    route: 'organization',
  },
  {
    label: 'Account',
    value: 'account',
    icon: <UserIcon {...iconProps} />,
    route: 'account',
  },
];

export function SettingsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentTab =
    tabs.find((tab) => pathname.includes(tab.value)) || tabs[0];
  return (
    <Tabs
      className="h-full h-full w-full flex-row gap-4"
      defaultValue={currentTab.value}
      orientation="vertical"
    >
      <div className="flex h-full flex-col">
        <TabsList className="h-fit flex-col gap-1 rounded-none bg-transparent px-1 py-0 text-foreground">
          {tabs.map((tab) => (
            <TabsTrigger
              className="after:-ms-1 relative w-full justify-start after:absolute after:inset-y-0 after:start-0 after:w-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:hover:bg-accent data-[state=active]:after:bg-primary"
              key={tab.value}
              onClick={() => router.push(`/settings/${tab.route}`)}
              value={tab.value}
            >
              {tab.icon}
              <span className="text-base">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
