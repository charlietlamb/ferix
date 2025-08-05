'use client';

import type { User } from 'better-auth';
import { useTranslations } from 'next-intl';

export function ChatPreview({ user }: { user: User | null }) {
  const t = useTranslations('chat.preview');
  const firstName = user?.name?.split(' ')[0];
  const displayString = firstName
    ? `${t('title.before-name')} ${firstName || 'there'}, ${t('title.after-name')}`
    : ' ';

  return <div className="text-center text-2xl">{displayString}</div>;
}
