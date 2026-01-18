"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { getGithubAvatarUrl } from "@ferix/ui/lib/repositories";
import { cn } from "@ferix/ui/lib/utils";

interface RepositoryLinkProps {
  repositoryId: string;
  owner: string;
  repo: string;
  className?: string;
}

export function RepositoryLink({
  repositoryId: _repositoryId,
  owner,
  repo,
  className,
}: RepositoryLinkProps) {
  const router = useRouter();

  return (
    <button
      className={cn(
        "group/repository-link flex cursor-pointer items-center gap-2 text-left",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/repository/${owner}/${repo}`);
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
      <span className="text-xs underline-offset-2 transition-colors group-hover/repository-link:text-foreground group-hover/repository-link:underline">
        {owner}/{repo}
      </span>
    </button>
  );
}
