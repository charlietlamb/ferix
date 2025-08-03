import { SettingsTabs } from '@ferix/ui/components/dashboard/settings/settings-tabs';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-row py-4">
      <SettingsTabs>{children}</SettingsTabs>
    </div>
  );
}
