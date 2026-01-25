/**
 * Strip frontmatter (content between --- delimiters) from markdown content
 */
export function stripFrontmatter(content: string): string {
  const lines = content.split("\n");

  if (lines[0]?.trim() === "---") {
    const endIndex = lines.findIndex(
      (line, i) => i > 0 && line.trim() === "---"
    );
    if (endIndex > 0) {
      return lines
        .slice(endIndex + 1)
        .join("\n")
        .trimStart();
    }
  }

  return content;
}

/**
 * Extract a description from markdown content (first non-heading paragraph)
 * Skips frontmatter (content between --- delimiters)
 */
export function extractDescription(content: string): string | null {
  const strippedContent = stripFrontmatter(content);
  const lines = strippedContent.split("\n");

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
