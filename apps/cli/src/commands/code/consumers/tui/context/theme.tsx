import { createSimpleContext } from "./helper.js";
import type { ThemeMode } from "./theme-constants.js";
import {
  box,
  darkTheme,
  getToolColor,
  lightTheme,
  symbols,
} from "./theme-constants.js";

/**
 * Theme context for accessing colors throughout the TUI.
 */
export const { use: useTheme, provider: ThemeProvider } = createSimpleContext({
  name: "Theme",
  init: (input: { mode?: ThemeMode }) => {
    const mode = input.mode ?? "dark";
    const theme = mode === "dark" ? darkTheme : lightTheme;

    return {
      mode,
      theme,
      getToolColor,
      symbols,
      box,
      styles: {
        container: {
          borderColor: theme.border,
        },
        heading: {
          fg: theme.text,
          bold: true,
        },
        label: {
          fg: theme.textDim,
        },
        muted: {
          fg: theme.textMuted,
        },
        statusRunning: {
          fg: theme.brand,
        },
        statusSuccess: {
          fg: theme.success,
        },
        statusError: {
          fg: theme.error,
        },
        statusPending: {
          fg: theme.textDim,
        },
      },
    };
  },
});
