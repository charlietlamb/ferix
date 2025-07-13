import { BetterAuthUIProvider } from './better-auth-ui-provider'
import { ThemeProvider } from './theme-provider'
import { NextIntlClientProvider } from 'next-intl'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <NextIntlClientProvider>
        <BetterAuthUIProvider>{children}</BetterAuthUIProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  )
}
