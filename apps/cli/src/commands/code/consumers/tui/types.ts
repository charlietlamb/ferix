import type { RGBA } from "@opentui/core";

/**
 * A styled text chunk for TUI rendering.
 * Used for inline text styling (e.g., ferix tags).
 */
export interface StyledChunk {
  readonly text: string;
  readonly fg?: RGBA;
  readonly bg?: RGBA;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly strikethrough?: boolean;
}
