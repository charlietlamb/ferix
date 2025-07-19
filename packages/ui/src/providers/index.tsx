import { NextIntlClientProvider } from 'next-intl';
import { BetterAuthUIProvider } from './better-auth-ui-provider';
import { TanstackQueryProvider } from './tanstack-query-provider';
import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <NextIntlClientProvider>
        <BetterAuthUIProvider>
          <TanstackQueryProvider>{children}</TanstackQueryProvider>
        </BetterAuthUIProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
};
