import { AcceptInvitationCard } from '@daveyplate/better-auth-ui';
import { useTranslations } from 'next-intl';

export default function AcceptInvitationPage() {
  const t = useTranslations('organization.invitation');
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AcceptInvitationCard
        className="max-w-2xl"
        classNames={{
          button: 'cursor-pointer',
        }}
        localization={{
          ACCEPT: t('accept'),
          REJECT: t('reject'),
        }}
      />
    </div>
  );
}
