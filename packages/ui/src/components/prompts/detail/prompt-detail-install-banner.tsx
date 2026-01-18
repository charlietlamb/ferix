"use client";

import { Link } from "@ferix/i18n/navigation";
import { Button } from "@ferix/ui/components/ui/button";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import {
  getGithubAvatarUrl,
  getRepositoryDisplayName,
} from "@ferix/ui/lib/repositories";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

interface PromptDetailInstallBannerProps {
  repository: {
    _id: string;
    owner: string;
    repo: string;
    name?: string;
  };
  promptCount: number;
}

export function PromptDetailInstallBanner({
  repository,
  promptCount,
}: PromptDetailInstallBannerProps) {
  const t = useTranslations("promptDetail");
  const { copy, copied } = useCopy();

  const command = `npx skills add ${repository.owner}/${repository.repo}`;
  const repositoryTitle = getRepositoryDisplayName(repository);

  const handleCopy = () => {
    if (!copied) {
      copy(command);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 border-border border-b bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-3">
        <Link href={`/repository/${repository.owner}/${repository.repo}`}>
          <img
            alt={repository.owner}
            className="size-8 shrink-0 border border-border"
            height={32}
            src={getGithubAvatarUrl(repository.owner)}
            width={32}
          />
        </Link>
        <div className="flex flex-col">
          <span className="text-sm">
            {t("installDescription", {
              count: promptCount,
              repository: repositoryTitle,
            })}
          </span>
          <Link
            className="text-muted-foreground text-xs hover:underline"
            href={`/repository/${repository.owner}/${repository.repo}`}
          >
            {t("viewRepository")}
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
        <code className="max-w-64 truncate font-mono text-sm">{command}</code>
        <Button
          className="size-7 shrink-0"
          onClick={handleCopy}
          size="icon"
          variant="ghost"
        >
          {copied ? (
            <CheckIcon className="size-4 text-green-500" />
          ) : (
            <CopyIcon className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
