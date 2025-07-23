import { OrganizationSettingsCards } from '@daveyplate/better-auth-ui';
import { SettingsWrapper } from './settings-wrapper';

export function OrganizationSettings() {
  return (
    <SettingsWrapper
      description="Manage your organization settings"
      title="Organization"
    >
      <OrganizationSettingsCards />
    </SettingsWrapper>
  );
}
