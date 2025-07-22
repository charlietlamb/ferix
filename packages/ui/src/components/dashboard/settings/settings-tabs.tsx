'use client';

import { useRouter } from '@ferix/i18n/navigation';
import { Tabs, TabsList, TabsTrigger } from '@ferix/ui/components/shadcn/tabs';
import { BoxIcon, HouseIcon, PanelsTopLeftIcon } from 'lucide-react';

type Tab = {
  label: string;
  value: string;
  icon: React.ReactNode;
  route: string;
};

const tabs: Tab[] = [
  {
    label: 'Overview',
    value: 'overview',
    icon: (
      <HouseIcon
        aria-hidden="true"
        className="-ms-0.5 me-1.5 opacity-60"
        size={16}
      />
    ),
    route: '',
  },
  {
    label: 'Subscriptions',
    value: 'subscriptions',
    icon: (
      <PanelsTopLeftIcon
        aria-hidden="true"
        className="-ms-0.5 me-1.5 opacity-60"
        size={16}
      />
    ),
    route: 'subscriptions',
  },
  {
    label: 'Organization',
    value: 'organization',
    icon: (
      <BoxIcon
        aria-hidden="true"
        className="-ms-0.5 me-1.5 opacity-60"
        size={16}
      />
    ),
    route: 'organization',
  },
];

export function SettingsTabs() {
  const router = useRouter();
  return (
    <Tabs
      className="h-full w-full flex-row"
      defaultValue={tabs[0].value}
      orientation="vertical"
    >
      <TabsList className="h-fit flex-col gap-1 rounded-none bg-transparent px-1 py-0 text-foreground">
        {tabs.map((tab) => (
          <TabsTrigger
            className="after:-ms-1 relative w-full justify-start after:absolute after:inset-y-0 after:start-0 after:w-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:hover:bg-accent data-[state=active]:after:bg-primary"
            key={tab.value}
            onClick={() => router.push(`/settings/${tab.route}`)}
            value={tab.value}
          >
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
