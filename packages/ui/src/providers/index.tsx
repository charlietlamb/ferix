import { NextIntlClientProvider } from 'next-intl';
import { BetterAuthUIProvider } from './better-auth-ui-provider';
import { ConvexProvider } from './convex-provider';
import { ModalProvider } from './modal-provider';
import { NuqsProvider } from './nuqs-provider';
import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConvexProvider>
      <ThemeProvider>
        <NextIntlClientProvider>
          <BetterAuthUIProvider>
            <NuqsProvider>
              <ModalProvider>{children}</ModalProvider>
            </NuqsProvider>
          </BetterAuthUIProvider>
        </NextIntlClientProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
};
