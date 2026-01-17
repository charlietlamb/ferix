"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { getGithubAvatarUrl } from "@ferix/ui/lib/directories";
import { cn } from "@ferix/ui/lib/utils";

interface DirectoryLinkProps {
  directoryId: string;
  owner: string;
  repo: string;
  className?: string;
}

export function DirectoryLink({
  directoryId,
  owner,
  repo,
  className,
}: DirectoryLinkProps) {
  const router = useRouter();

  return (
    <button
      className={cn(
        "group/directory-link flex cursor-pointer items-center gap-2 text-left",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/directory/${directoryId}`);
      }}
      type="button"
    >
      <img
        alt={owner}
        className="size-5 shrink-0 border border-border"
        height={20}
        src={getGithubAvatarUrl(owner)}
        width={20}
      />
      <span className="max-w-24 truncate text-xs underline-offset-2 transition-colors group-hover/directory-link:text-foreground group-hover/directory-link:underline">
        {owner}/{repo}
      </span>
    </button>
  );
}
