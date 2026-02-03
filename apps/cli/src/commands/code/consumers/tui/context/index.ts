/**
 * TUI Context exports.
 *
 * These contexts provide the foundation for the TUI architecture,
 * following patterns from OpenCode's @opentui/solid implementation.
 */

export { DaemonProvider, useDaemon } from "./daemon.js";
export { ExitProvider, useExit } from "./exit.js";
export {
  type Route,
  RouteProvider,
  useRoute,
} from "./route.js";
export {
  ThemeProvider,
  useTheme,
} from "./theme.js";
export {
  Toast,
  ToastProvider,
  useToast,
} from "./toast.js";
