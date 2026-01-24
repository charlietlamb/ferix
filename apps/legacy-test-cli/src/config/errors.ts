/**
 * Config-specific error types for ferix.json handling
 */

import { FerixError } from "../types/errors.js";

/**
 * Error parsing ferix.json as JSON
 */
export class ConfigParseError extends FerixError {
  readonly filePath: string;
  readonly line?: number;

  constructor(filePath: string, message: string, line?: number) {
    const lineInfo = line !== undefined ? ` at line ${line}` : "";
    super(`Failed to parse ${filePath}${lineInfo}: ${message}`, 1);
    this.name = "ConfigParseError";
    this.filePath = filePath;
    this.line = line;
  }
}

/**
 * Error validating ferix.json schema
 */
export class ConfigValidationError extends FerixError {
  readonly filePath: string;
  readonly field: string;

  constructor(filePath: string, field: string, message: string) {
    super(`Invalid ${filePath} - '${field}' ${message}`, 1);
    this.name = "ConfigValidationError";
    this.filePath = filePath;
    this.field = field;
  }
}
