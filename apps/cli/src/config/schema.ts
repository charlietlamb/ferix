/**
 * Schema types for ferix.json configuration file
 */

/**
 * Configuration loaded from ferix.json file.
 * All fields are optional - missing fields use defaults.
 */
export interface FerixFileConfig {
  /** Verification commands to run after task completion */
  verify?: string[];

  /** Default iteration limit. Use -1 for unlimited. */
  iterations?: number;

  /** Progress file path, or false to disable progress tracking */
  progress?: string | false;
}

/**
 * Validated config with explicit field presence tracking
 */
export interface LoadedConfig {
  /** The parsed config values */
  config: FerixFileConfig;

  /** Whether a config file was found and loaded */
  found: boolean;

  /** Path to the config file (if found) */
  path?: string;
}

/**
 * Tracks which CLI options were explicitly set by the user.
 * Used for config precedence - explicit CLI flags override config file values.
 */
export interface ExplicitCliFlags {
  /** Whether --verify or --no-verify was explicitly used */
  verify: boolean;

  /** Whether --iterations was explicitly used */
  iterations: boolean;

  /** Whether --progress or --no-progress was explicitly used */
  progress: boolean;
}
