"use client";

import { Link } from "@ferix/i18n/navigation";
import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import { StatRow } from "@ferix/ui/components/prompts/shared/stat-row";
import { Button } from "@ferix/ui/components/ui/button";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import { formatStars, type McpServerBase } from "@ferix/ui/lib/mcp";
import {
  CalendarIcon,
  CheckIcon,
  GithubLogoIcon,
  GlobeIcon,
  LinkSimpleIcon,
  PackageIcon,
  StarIcon,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

interface McpDetailSidebarProps {
  server: McpServerBase;
}

export function McpDetailSidebar({ server }: McpDetailSidebarProps) {
  const t = useTranslations("pages.mcp.detail");
  const { copy: copyLink, copied: linkCopied } = useCopy();

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    if (!linkCopied) {
      copyLink(pageUrl);
    }
  };

  const hasLinks = server.repositoryUrl || server.websiteUrl;

  return (
    <aside className="flex flex-col overflow-auto border-border border-t md:w-[320px] md:shrink-0 md:border-t-0 md:border-l">
      {hasLinks && (
        <PromptSection title={t("links")}>
          <div className="flex flex-col gap-2">
            {server.repositoryUrl && (
              <Link
                className="flex items-center gap-2 text-sm hover:underline"
                href={server.repositoryUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <GithubLogoIcon className="size-4 text-muted-foreground" />
                <span>{t("repository")}</span>
              </Link>
            )}
            {server.websiteUrl && (
              <Link
                className="flex items-center gap-2 text-sm hover:underline"
                href={server.websiteUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <GlobeIcon className="size-4 text-muted-foreground" />
                <span>{t("website")}</span>
              </Link>
            )}
          </div>
        </PromptSection>
      )}

      <PromptSection title={t("stats")}>
        <div className="flex flex-col gap-2">
          {server.githubStars !== undefined && server.githubStars > 0 && (
            <StatRow
              icon={StarIcon}
              label={t("stars")}
              value={formatStars(server.githubStars)}
            />
          )}
          <StatRow
            icon={PackageIcon}
            label={t("packages")}
            value={server.packages.length}
          />
        </div>
      </PromptSection>

      <PromptSection title={t("details")}>
        <div className="flex flex-col gap-2">
          <StatRow
            icon={PackageIcon}
            label={t("version")}
            value={server.version}
          />
          {server.registryUpdatedAt && (
            <StatRow
              icon={CalendarIcon}
              label={t("lastUpdated")}
              labelFirst
              value={formatDistanceToNow(server.registryUpdatedAt, {
                addSuffix: true,
              })}
            />
          )}
          {server.publishedAt && (
            <StatRow
              icon={CalendarIcon}
              label={t("published")}
              labelFirst
              value={formatDistanceToNow(server.publishedAt, {
                addSuffix: true,
              })}
            />
          )}
        </div>
      </PromptSection>

      <PromptSection border={false} title="Actions">
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
            Copy Link
          </Button>
        </div>
      </PromptSection>
    </aside>
  );
}
