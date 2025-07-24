'use client';

import {
  RadioGroup,
  RadioGroupItem,
} from '@ferix/ui/components/shadcn/radio-group';
import { CheckIcon, MinusIcon } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useId } from 'react';
import { SettingsWrapper } from './settings-wrapper';

const items = [
  { value: 'light', label: 'Light', image: '/ui-light.png' },
  { value: 'dark', label: 'Dark', image: '/ui-dark.png' },
  { value: 'system', label: 'System', image: '/ui-system.png' },
];

export function AppearanceSettings() {
  const t = useTranslations('settings.appearance');
  const id = useId();
  const { theme, setTheme } = useTheme();
  return (
    <SettingsWrapper description={t('description')} title={t('heading')}>
      <RadioGroup
        className="flex gap-3"
        defaultValue={theme}
        onValueChange={(value) => setTheme(value)}
      >
        {items.map((item) => (
          <label htmlFor={`${id}-${item.value}`} key={`${id}-${item.value}`}>
            <RadioGroupItem
              className="peer sr-only after:absolute after:inset-0"
              id={`${id}-${item.value}`}
              value={item.value}
            />
            <Image
              alt={item.label}
              className="relative cursor-pointer overflow-hidden rounded-md border border-input shadow-xs outline-none transition-[color,box-shadow] peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-data-disabled:cursor-not-allowed peer-data-[state=checked]:border-ring peer-data-[state=checked]:bg-accent peer-data-disabled:opacity-50"
              height={70}
              src={item.image}
              width={88}
            />
            <span className="group mt-2 flex items-center gap-1 peer-data-[state=unchecked]:text-muted-foreground/70">
              <CheckIcon
                aria-hidden="true"
                className="group-peer-data-[state=unchecked]:hidden"
                size={16}
              />
              <MinusIcon
                aria-hidden="true"
                className="group-peer-data-[state=checked]:hidden"
                size={16}
              />
              <span className="font-medium text-xs">{item.label}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </SettingsWrapper>
  );
}
