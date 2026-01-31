/**
 * CLI authentication configuration.
 */
export const authConfig = {
  /**
   * Base URL for the Ferix API.
   * Can be overridden via FERIX_API_URL environment variable.
   */
  apiUrl: process.env.FERIX_API_URL ?? "https://ferix.dev",

  /**
   * Client ID for the CLI device authorization flow.
   */
  clientId: "ferix-cli",

  /**
   * Default polling interval in seconds.
   */
  defaultPollingInterval: 5,

  /**
   * Maximum polling duration in milliseconds (10 minutes).
   */
  maxPollingDuration: 600_000,
} as const;
