import { ThemeProvider as NextThemeProvider } from 'next-themes';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemeProvider>
  );
};
