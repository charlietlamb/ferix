import { cn } from "@ferix/ui/lib/utils";

/**
 * Top directories to feature on the home page
 * These are GitHub URLs that will be matched against stored directories
 */
export const TOP_DIRECTORY_URLS = ["https://github.com/better-auth/skills"];

/**
 * Regex for parsing GitHub URLs
 */
const GITHUB_URL_REGEX = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/?$/;

/**
 * Parse a GitHub URL to extract owner and repo
 */
export function parseGithubUrl(
  url: string
): { owner: string; repo: string } | null {
  const match = url.match(GITHUB_URL_REGEX);
  if (!(match?.[1] && match?.[2])) {
    return null;
  }
  return { owner: match[1], repo: match[2] };
}

/**
 * Get parsed directory info from TOP_DIRECTORY_URLS
 */
export function getTopDirectories() {
  return TOP_DIRECTORY_URLS.map((url) => {
    const parsed = parseGithubUrl(url);
    if (!parsed) {
      return null;
    }
    return { ...parsed, url };
  }).filter((d): d is NonNullable<typeof d> => d !== null);
}

/**
 * Format a slug/filename into a readable title
 * "my-cool-skill" -> "My Cool Skill"
 */
export function formatTitle(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get GitHub avatar URL for an owner/org
 */
export function getGithubAvatarUrl(owner: string): string {
  return `https://github.com/${owner}.png`;
}

/**
 * Base directory type used across components
 */
export interface DirectoryBase {
  _id: string;
  owner: string;
  repo: string;
  syncStatus?: "syncing" | "success" | "error";
}

/**
 * Get responsive grid border classes for a grid item
 * Handles 2-column mobile and 4-column desktop layouts
 */
export function getGridItemBorderClasses(
  index: number,
  totalItems: number,
  options?: {
    colsMobile?: number;
    colsDesktop?: number;
    alwaysShowBottomBorder?: boolean;
  }
): string {
  const colsMobile = options?.colsMobile ?? 2;
  const colsDesktop = options?.colsDesktop ?? 4;
  const alwaysShowBottomBorder = options?.alwaysShowBottomBorder ?? false;

  const lastRowMobile = Math.ceil(totalItems / colsMobile) - 1;
  const lastRowDesktop = Math.ceil(totalItems / colsDesktop) - 1;
  const rowMobile = Math.floor(index / colsMobile);
  const rowDesktop = Math.floor(index / colsDesktop);
  const isLastRowMobile = rowMobile === lastRowMobile;
  const isLastRowDesktop = rowDesktop === lastRowDesktop;

  return cn(
    "border-border",
    index % colsMobile !== colsMobile - 1 && "max-md:border-r",
    index % colsDesktop !== colsDesktop - 1 && "md:border-r",
    (alwaysShowBottomBorder || !isLastRowMobile) && "max-md:border-b",
    (alwaysShowBottomBorder || !isLastRowDesktop) && "md:border-b"
  );
}
