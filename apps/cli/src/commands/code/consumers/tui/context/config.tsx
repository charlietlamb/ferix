import type { FerixConfig } from "../../../config/index.js";
import { createSimpleContext } from "./helper.js";

/**
 * Config context that provides ferix.json values to TUI components.
 * Used for pre-filling session defaults (iterations, verify, provider, etc).
 */
export const { use: useConfig, provider: ConfigProvider } = createSimpleContext(
  {
    name: "Config",
    gate: false,
    init: (input: { config: FerixConfig }) => input.config,
  }
);
