import {
  AccountSettingsCards,
  SecuritySettingsCards,
} from '@daveyplate/better-auth-ui';
import { useTranslations } from 'next-intl';
import { SettingsWrapper } from './settings-wrapper';

export function AccountSettings() {
  const t = useTranslations('settings.account');
  return (
    <SettingsWrapper description={t('description')} title={t('heading')}>
      <AccountSettingsCards />
      <SecuritySettingsCards />
    </SettingsWrapper>
  );
}
