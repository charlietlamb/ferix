/**
 * Config file loading and validation for ferix.json
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ConfigParseError, ConfigValidationError } from "./errors.js";
import type { FerixFileConfig, LoadedConfig } from "./schema.js";

const CONFIG_FILENAME = "ferix.json";

/** Regex to extract line number from error messages like "at line 42" */
const LINE_REGEX = /line\s+(\d+)/i;

/** Regex to extract position from error messages like "at position 123" */
const POSITION_REGEX = /position\s+(\d+)/i;

/** Regex to count newlines in a string */
const NEWLINE_REGEX = /\n/g;

/**
 * Extract line number from JSON parse error message
 */
function extractLineNumber(error: Error, content?: string): number | undefined {
  // First try to match explicit line number
  const lineMatch = error.message.match(LINE_REGEX);
  if (lineMatch) {
    return Number.parseInt(lineMatch[1], 10);
  }

  // Try to calculate line from position if content is provided
  const positionMatch = error.message.match(POSITION_REGEX);
  if (positionMatch && content) {
    const position = Number.parseInt(positionMatch[1], 10);
    // Count newlines before the error position to get line number
    const beforeError = content.slice(0, position);
    const lineNumber = (beforeError.match(NEWLINE_REGEX) || []).length + 1;
    return lineNumber;
  }

  return undefined;
}

/**
 * Validate the verify field is an array of strings
 */
function validateVerify(
  value: unknown,
  filePath: string
): asserts value is string[] | undefined {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    throw new ConfigValidationError(filePath, "verify", "must be an array");
  }
  for (const item of value) {
    if (typeof item !== "string") {
      throw new ConfigValidationError(
        filePath,
        "verify",
        "must be an array of strings"
      );
    }
  }
}

/**
 * Validate the iterations field is a number >= -1
 */
function validateIterations(
  value: unknown,
  filePath: string
): asserts value is number | undefined {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ConfigValidationError(filePath, "iterations", "must be a number");
  }
  if (value < -1) {
    throw new ConfigValidationError(filePath, "iterations", "must be >= -1");
  }
  if (!Number.isInteger(value)) {
    throw new ConfigValidationError(
      filePath,
      "iterations",
      "must be an integer"
    );
  }
}

/**
 * Validate the progress field is a string or false
 */
function validateProgress(
  value: unknown,
  filePath: string
): asserts value is string | false | undefined {
  if (value === undefined) {
    return;
  }
  if (value === false) {
    return;
  }
  if (typeof value !== "string") {
    throw new ConfigValidationError(
      filePath,
      "progress",
      "must be a string or false"
    );
  }
  if (value === "") {
    throw new ConfigValidationError(
      filePath,
      "progress",
      "cannot be an empty string (use false to disable)"
    );
  }
}

/**
 * Validate the parsed config object
 */
function validateConfig(
  config: unknown,
  filePath: string
): asserts config is FerixFileConfig {
  if (config === null || typeof config !== "object") {
    throw new ConfigValidationError(filePath, "(root)", "must be an object");
  }

  const obj = config as Record<string, unknown>;

  validateVerify(obj.verify, filePath);
  validateIterations(obj.iterations, filePath);
  validateProgress(obj.progress, filePath);
}

/**
 * Load and validate the ferix.json config file from the current directory.
 *
 * @returns LoadedConfig with config values and metadata
 * @throws ConfigParseError if file exists but contains invalid JSON
 * @throws ConfigValidationError if file exists but fails schema validation
 */
export async function loadConfig(): Promise<LoadedConfig> {
  const filePath = join(process.cwd(), CONFIG_FILENAME);

  let content: string;
  try {
    content = await readFile(filePath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { config: {}, found: false };
    }
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const line = extractLineNumber(error as Error, content);
    throw new ConfigParseError(CONFIG_FILENAME, (error as Error).message, line);
  }

  validateConfig(parsed, CONFIG_FILENAME);

  return {
    config: parsed,
    found: true,
    path: filePath,
  };
}
