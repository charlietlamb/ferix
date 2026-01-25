"use client";

import { Link } from "@ferix/i18n/navigation";
import type { Doc } from "@ferix/server/_generated/dataModel";
import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import { StatRow } from "@ferix/ui/components/prompts/shared/stat-row";
import { TypeBadge } from "@ferix/ui/components/prompts/shared/type-badge";
import { Button } from "@ferix/ui/components/ui/button";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import { getGithubAvatarUrl } from "@ferix/ui/lib/repositories";
import { getTagsByIds } from "@ferix/ui/lib/tags";
import {
  CalendarIcon,
  CheckIcon,
  DownloadSimpleIcon,
  FilesIcon,
  GithubLogoIcon,
  LinkSimpleIcon,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type Directory = Doc<"directories">;

interface RepositorySidebarProps {
  repository: Directory;
}

export function RepositorySidebar({ repository }: RepositorySidebarProps) {
  const t = useTranslations("promptDetail");
  const { copy: copyLink, copied: linkCopied } = useCopy();

  const githubAvatarUrl = getGithubAvatarUrl(repository.owner);
  const githubRepoUrl = `https://github.com/${repository.owner}/${repository.repo}`;
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const tags = useMemo(
    () => getTagsByIds(repository.tags ?? []),
    [repository.tags]
  );

  const handleCopyLink = () => {
    if (!linkCopied) {
      copyLink(pageUrl);
    }
  };

  return (
    <aside className="flex flex-col overflow-auto border-border border-t md:w-[320px] md:shrink-0 md:border-t-0 md:border-l">
      <PromptSection title={t("repository")}>
        <Link
          className="flex items-center gap-2 text-sm hover:underline"
          href={githubRepoUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <img
            alt={repository.owner}
            className="size-5 rounded-full"
            height={20}
            src={githubAvatarUrl}
            width={20}
          />
          <span>
            {repository.owner}/{repository.repo}
          </span>
          <GithubLogoIcon className="ml-auto size-4 text-muted-foreground" />
        </Link>
      </PromptSection>

      <PromptSection title={t("stats")}>
        <div className="flex flex-col gap-2">
          <StatRow
            icon={DownloadSimpleIcon}
            label={t("downloads")}
            value={(repository.totalDownloads ?? 0).toLocaleString()}
          />
          <StatRow
            icon={FilesIcon}
            label="prompts"
            value={(repository.promptCount ?? 0).toLocaleString()}
          />
        </div>
      </PromptSection>

      <PromptSection title={t("details")}>
        <div className="flex flex-col gap-2">
          {repository.lastSyncedAt && (
            <StatRow
              icon={CalendarIcon}
              label={t("lastEdited")}
              labelFirst
              value={formatDistanceToNow(repository.lastSyncedAt, {
                addSuffix: true,
              })}
            />
          )}
          <StatRow
            icon={CalendarIcon}
            label={t("created")}
            labelFirst
            value={formatDistanceToNow(repository.createdAt, {
              addSuffix: true,
            })}
          />
        </div>
      </PromptSection>

      <PromptSection title={t("type")}>
        <TypeBadge type="skill" />
      </PromptSection>

      {tags.length > 0 && (
        <PromptSection title={t("tags")}>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const Icon = tag.icon;
              return (
                <div
                  className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs"
                  key={tag.id}
                >
                  <Icon size={12} />
                  <span>{tag.label}</span>
                </div>
              );
            })}
          </div>
        </PromptSection>
      )}

      <PromptSection border={false} title={t("actions")}>
        <div className="flex flex-col gap-2">
          <Button
            className="w-full justify-start"
            onClick={handleCopyLink}
            variant="outline"
          >
            {linkCopied ? (
              <CheckIcon className="mr-2 size-4 text-green-500" />
            ) : (
              <LinkSimpleIcon className="mr-2 size-4" />
            )}
            {t("copyLink")}
          </Button>
        </div>
      </PromptSection>
    </aside>
  );
}
