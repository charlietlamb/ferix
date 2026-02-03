/**
 * TUI tag system for styled text rendering.
 *
 * This module provides a tag registry and handlers for converting
 * ferix markup tags into styled chunks for TUI rendering.
 *
 * @example
 * ```typescript
 * import { styleFerixTags } from './tags';
 *
 * const chunks = styleFerixTags('>> Read file.ts', 80);
 * // Returns styled chunks with tool-specific coloring
 * ```
 */

// Import handlers to register them
import "./handlers/index.js";

import type { StyledChunk } from "../types.js";
import { tagRendererRegistry } from "./registry.js";

/**
 * Applies ferix tag styling to a line of text.
 * This is the main entry point for tag styling.
 *
 * @param line - The raw text line to style
 * @param width - Terminal width for responsive rendering
 * @returns Array of styled chunks for rendering
 */
export function styleFerixTags(line: string, width: number): StyledChunk[] {
  return tagRendererRegistry.style(line, width);
}
