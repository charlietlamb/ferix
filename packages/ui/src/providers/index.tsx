import { NextIntlClientProvider } from 'next-intl';
import { BetterAuthUIProvider } from './better-auth-ui-provider';
import { ConvexProvider } from './convex-provider';
import { ModalProvider } from './modal-provider';
import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <NextIntlClientProvider>
        <ConvexProvider>
          <BetterAuthUIProvider>
            <ModalProvider>{children}</ModalProvider>
          </BetterAuthUIProvider>
        </ConvexProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
};
