// Title extraction and formatting utilities

import { MD_EXTENSION_REGEX } from "../regex";

const GENERIC_FILENAMES = [
  "skill",
  "skills",
  "agent",
  "agents",
  "readme",
  "index",
];

/**
 * Extract title from file path
 * Format: "{Display Name} - {File/Directory Name}"
 *
 * Examples:
 *   - "create-auth/SKILL.md" with owner "better-auth" -> "Better Auth - Create Auth"
 *   - "explain-error.md" with owner "better-auth" -> "Better Auth - Explain Error"
 *   - "SKILL.md" (at root) with owner "better-auth" -> "Better Auth"
 *   - "add-payments.md" with displayName "Autumn" -> "Autumn - Add Payments"
 */
export function extractTitle(
  filePath: string,
  ownerName: string,
  displayName?: string
): string {
  const ownerTitle = displayName?.trim() || formatTitle(ownerName);
  const parts = filePath.split("/");
  const filename = parts.at(-1) ?? "";
  // Remove .md extension (case insensitive)
  const filenameWithoutExt = filename.replace(MD_EXTENSION_REGEX, "");

  // Check if filename is generic
  if (GENERIC_FILENAMES.includes(filenameWithoutExt.toLowerCase())) {
    // Use parent directory name if available
    if (parts.length > 1) {
      const dirName = parts.at(-2);
      const dirTitle = formatTitle(dirName ?? "");
      // If dir title is same as owner title, just return owner title
      if (dirTitle.toLowerCase() === ownerTitle.toLowerCase()) {
        return ownerTitle;
      }
      return `${ownerTitle} - ${dirTitle}`;
    }
    // At root with generic name, just return owner name
    return ownerTitle;
  }

  // Non-generic filename
  const fileTitle = formatTitle(filenameWithoutExt);
  // If file title is same as owner title, just return owner title
  if (fileTitle.toLowerCase() === ownerTitle.toLowerCase()) {
    return ownerTitle;
  }
  return `${ownerTitle} - ${fileTitle}`;
}

/**
 * Format a slug/filename into a readable title
 * "my-cool-skill" -> "My Cool Skill"
 */
export function formatTitle(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Generate a URL-safe slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
