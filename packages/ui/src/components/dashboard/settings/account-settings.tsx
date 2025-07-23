import {
  AccountSettingsCards,
  SecuritySettingsCards,
} from '@daveyplate/better-auth-ui';
import { SettingsWrapper } from './settings-wrapper';

export function AccountSettings() {
  return (
    <SettingsWrapper description="Manage your account settings" title="Account">
      <AccountSettingsCards />
      <SecuritySettingsCards />
    </SettingsWrapper>
  );
}
