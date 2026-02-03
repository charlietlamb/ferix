import { TextAttributes } from "@opentui/core";
import { For, Show } from "solid-js";
import { useTheme } from "../context/index.js";
import type { StyledChunk } from "../types.js";

interface StyledLineProps {
  /** Array of styled chunks to render */
  readonly chunks: readonly StyledChunk[];
  /** Maximum width for truncation (optional) */
  readonly maxWidth?: number;
}

/**
 * Calculates the total visible length of styled chunks.
 * @param chunks - Array of styled chunks
 * @returns Total character length
 */
function getTotalLength(chunks: readonly StyledChunk[]): number {
  return chunks.reduce((sum, chunk) => sum + chunk.text.length, 0);
}

/**
 * Truncates styled chunks to fit within a maximum width.
 * Preserves styling while truncating from the end.
 *
 * @param chunks - Array of styled chunks
 * @param maxWidth - Maximum visible width
 * @param textMuted - Color for ellipsis
 * @returns Truncated array of styled chunks with ellipsis if needed
 */
function truncateChunks(
  chunks: readonly StyledChunk[],
  maxWidth: number,
  textMuted: StyledChunk["fg"]
): StyledChunk[] {
  if (maxWidth <= 3) {
    return [{ text: ".".repeat(Math.max(0, maxWidth)) }];
  }

  const totalLength = getTotalLength(chunks);
  if (totalLength <= maxWidth) {
    return [...chunks];
  }

  const result: StyledChunk[] = [];
  let remaining = maxWidth - 3; // Reserve space for ellipsis

  for (const chunk of chunks) {
    if (remaining <= 0) {
      break;
    }

    if (chunk.text.length <= remaining) {
      result.push(chunk);
      remaining -= chunk.text.length;
    } else {
      result.push({ ...chunk, text: chunk.text.slice(0, remaining) });
      remaining = 0;
    }
  }

  result.push({ text: "...", fg: textMuted });
  return result;
}

/**
 * Gets text attributes for a styled chunk.
 * @param chunk - The styled chunk
 * @returns Combined text attributes or undefined
 */
function getAttributes(chunk: StyledChunk): number | undefined {
  // Build attributes array and combine
  const attrList: number[] = [];
  if (chunk.bold) {
    attrList.push(TextAttributes.BOLD);
  }
  if (chunk.italic) {
    attrList.push(TextAttributes.ITALIC);
  }
  if (chunk.underline) {
    attrList.push(TextAttributes.UNDERLINE);
  }
  if (chunk.strikethrough) {
    attrList.push(TextAttributes.STRIKETHROUGH);
  }
  if (attrList.length === 0) {
    return undefined;
  }
  // Combine using reduce to avoid direct bitwise assignment
  return attrList.reduce((acc, attr) => acc + attr, 0);
}

/**
 * Renders an array of styled chunks as OpenTUI text elements.
 * Supports inline styling with colors, backgrounds, and text attributes.
 *
 * Uses the theme context for default text color.
 *
 * @param props - Component props
 * @returns JSX element rendering the styled line
 *
 * @example
 * ```tsx
 * <StyledLine chunks={[
 *   { text: "Hello ", fg: theme.text },
 *   { text: "World", fg: theme.success, bold: true }
 * ]} />
 * ```
 */
export function StyledLine(props: StyledLineProps) {
  const { theme } = useTheme();

  const processedChunks = () => {
    // Safety check for empty/undefined chunks
    if (!props.chunks || props.chunks.length === 0) {
      return [{ text: " " }];
    }
    if (props.maxWidth !== undefined) {
      return truncateChunks(props.chunks, props.maxWidth, theme.textMuted);
    }
    return [...props.chunks]; // Return a copy to avoid mutation issues
  };

  return (
    <For each={processedChunks()}>
      {(chunk) => {
        const attrs = getAttributes(chunk);
        return (
          <Show
            fallback={<text fg={chunk.fg ?? theme.text}>{chunk.text}</text>}
            when={attrs !== undefined}
          >
            <text attributes={attrs} bg={chunk.bg} fg={chunk.fg ?? theme.text}>
              {chunk.text}
            </text>
          </Show>
        );
      }}
    </For>
  );
}
