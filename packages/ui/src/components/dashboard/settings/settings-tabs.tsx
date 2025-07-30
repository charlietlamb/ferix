'use client';

import { usePathname, useRouter } from '@ferix/i18n/navigation';
import { Tabs, TabsList, TabsTrigger } from '@ferix/ui/components/shadcn/tabs';
import { BoxIcon, HouseIcon, PaletteIcon, UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Tab = {
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
    value: 'overview',
    icon: <HouseIcon {...iconProps} />,
    route: '',
  },
  {
    value: 'organization',
    icon: <BoxIcon {...iconProps} />,
    route: 'organization',
  },
  {
    value: 'account',
    icon: <UserIcon {...iconProps} />,
    route: 'account',
  },
  {
    value: 'appearance',
    icon: <PaletteIcon {...iconProps} />,
    route: 'appearance',
  },
];

export function SettingsTabs({ children }: { children: React.ReactNode }) {
  const t = useTranslations('settings');
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
              className="relative w-full justify-start hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:hover:bg-accent"
              key={tab.value}
              onClick={() => router.push(`/settings/${tab.route}`)}
              value={tab.value}
            >
              {tab.icon}
              <span className="text-base">{t(`${tab.value}.label`)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
