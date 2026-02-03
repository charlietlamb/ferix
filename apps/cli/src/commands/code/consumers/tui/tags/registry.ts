import type { StyledChunk } from "../types.js";

/**
 * Tag handler interface for TUI rendering.
 * Handlers match regex patterns and return styled chunks for rendering.
 */
interface TagHandler {
  /** Regex pattern to match in text */
  readonly pattern: RegExp;
  /** Render function that returns styled chunks */
  readonly render: (match: RegExpMatchArray, width: number) => StyledChunk[];
}

/**
 * Registry for tag renderers.
 * Allows adding new tag handlers without modifying existing code.
 */
interface TagRendererRegistry {
  /**
   * Register a new tag handler.
   * @param handler - The handler to register
   */
  register(handler: TagHandler): void;

  /**
   * Apply all registered handlers to style a line of text.
   * @param line - The raw text line to style
   * @param width - Terminal width for responsive rendering
   * @returns Array of styled chunks representing the styled line
   */
  style(line: string, width: number): StyledChunk[];

  /**
   * Get all registered handlers.
   * @returns Readonly array of all handlers
   */
  getAll(): readonly TagHandler[];
}

/**
 * Process a single handler against a line, extracting matches and plain text.
 * @param line - The text line to process
 * @param pattern - The regex pattern to match
 * @param render - The render function for matches
 * @param width - Terminal width
 * @returns Array of styled chunks, or null if no matches found
 */
function processHandler(
  line: string,
  pattern: RegExp,
  render: (match: RegExpMatchArray, width: number) => StyledChunk[],
  width: number
): StyledChunk[] | null {
  // Reset regex state for global patterns
  pattern.lastIndex = 0;

  // Collect all matches first
  const matches: RegExpExecArray[] = [];
  let match = pattern.exec(line);
  while (match !== null) {
    matches.push(match);
    if (match[0].length === 0) {
      pattern.lastIndex++;
    }
    match = pattern.exec(line);
  }

  if (matches.length === 0) {
    return null;
  }

  // Build result from matches and intervening text
  const result: StyledChunk[] = [];
  let lastIndex = 0;

  for (const m of matches) {
    // Add plain text before the match
    if (m.index > lastIndex) {
      result.push({ text: line.slice(lastIndex, m.index) });
    }
    // Add the styled match
    result.push(...render(m, width));
    lastIndex = m.index + m[0].length;
  }

  // Add remaining plain text after last match
  if (lastIndex < line.length) {
    result.push({ text: line.slice(lastIndex) });
  }

  return result;
}

/**
 * Creates a new tag renderer registry.
 * @returns A new TagRendererRegistry instance
 */
function createTagRendererRegistry(): TagRendererRegistry {
  const handlers: TagHandler[] = [];

  return {
    register(handler) {
      handlers.push(handler);
    },

    style(line: string, width: number): StyledChunk[] {
      // Try each handler in order
      for (const { pattern, render } of handlers) {
        const result = processHandler(line, pattern, render, width);
        if (result !== null) {
          return result;
        }
      }

      // No handlers matched - return plain text
      return [{ text: line }];
    },

    getAll() {
      return handlers;
    },
  };
}

/** Singleton registry instance for tag renderers */
export const tagRendererRegistry = createTagRendererRegistry();
