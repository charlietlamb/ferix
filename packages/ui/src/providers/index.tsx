import { NextIntlClientProvider } from 'next-intl';
import { BetterAuthUIProvider } from './better-auth-ui-provider';
import { ModalProvider } from './modal-provider';
import { TanstackQueryProvider } from './tanstack-query-provider';
import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <NextIntlClientProvider>
        <BetterAuthUIProvider>
          <TanstackQueryProvider>
            <ModalProvider>{children}</ModalProvider>
          </TanstackQueryProvider>
        </BetterAuthUIProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
};
