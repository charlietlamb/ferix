import { BetterAuthUIProvider } from './better-auth-ui-provider'
import { ThemeProvider } from './theme-provider'
import { NextIntlClientProvider } from 'next-intl'
import { TanstackQueryProvider } from './tanstack-query-provider'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <NextIntlClientProvider>
        <BetterAuthUIProvider>
          <TanstackQueryProvider>{children}</TanstackQueryProvider>
        </BetterAuthUIProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  )
}
