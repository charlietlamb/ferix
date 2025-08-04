import { NextIntlClientProvider } from 'next-intl';
import { BetterAuthUIProvider } from './better-auth-ui-provider';
import { ConvexProvider } from './convex-provider';
import { ModalProvider } from './modal-provider';
import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConvexProvider>
      <ThemeProvider>
        <NextIntlClientProvider>
          <BetterAuthUIProvider>
            <ModalProvider>{children}</ModalProvider>
          </BetterAuthUIProvider>
        </NextIntlClientProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
};
