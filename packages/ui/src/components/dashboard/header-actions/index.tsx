'use client';

import { usePathname } from '@ferix/i18n/navigation';
import { DashboardHeaderActions } from './dashboard-header-actions';

const headerActionMap: Record<string, React.ReactNode> = {
  '/': <DashboardHeaderActions />,
};

export function HeaderActions() {
  const pathname = usePathname();
  const HeaderAction = headerActionMap[pathname];
  return HeaderAction;
}
