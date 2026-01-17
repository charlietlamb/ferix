/**
 * Extract a description from markdown content (first non-heading paragraph)
 * Skips frontmatter (content between --- delimiters)
 */
export function extractDescription(content: string): string | null {
  let lines = content.split("\n");

  if (lines[0]?.trim() === "---") {
    const endIndex = lines.findIndex(
      (line, i) => i > 0 && line.trim() === "---"
    );
    if (endIndex > 0) {
      lines = lines.slice(endIndex + 1);
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("```") ||
      trimmed === "---"
    ) {
      continue;
    }
    return trimmed;
  }
  return null;
}
