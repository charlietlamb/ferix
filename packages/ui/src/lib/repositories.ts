import { cn } from "@ferix/ui/lib/utils";

export const TOP_REPOSITORY_URLS = [
  "https://github.com/better-auth/skills",
  "https://github.com/vercel-labs/agent-skills",
  "https://github.com/expo/skills",
  "https://github.com/callstackincubator/agent-skills",
];

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/?$/;

export function parseGithubUrl(
  url: string
): { owner: string; repo: string } | null {
  const match = url.match(GITHUB_URL_REGEX);
  if (!(match?.[1] && match?.[2])) {
    return null;
  }
  return { owner: match[1], repo: match[2] };
}

export function getTopRepositories() {
  return TOP_REPOSITORY_URLS.map((url) => {
    const parsed = parseGithubUrl(url);
    if (!parsed) {
      return null;
    }
    return { ...parsed, url };
  }).filter((d): d is NonNullable<typeof d> => d !== null);
}

export function formatTitle(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getGithubAvatarUrl(owner: string): string {
  return `https://github.com/${owner}.png`;
}

export interface RepositoryBase {
  _id: string;
  owner: string;
  repo: string;
  syncStatus?: "syncing" | "success" | "error";
}

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
