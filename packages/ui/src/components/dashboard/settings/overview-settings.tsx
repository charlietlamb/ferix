import { useTranslations } from 'next-intl';
import { SettingsWrapper } from './settings-wrapper';

export function OverviewSettings() {
  const t = useTranslations('settings.overview');
  return (
    <SettingsWrapper description={t('description')} title={t('heading')}>
      Overview Settings Placeholder
    </SettingsWrapper>
  );
}
