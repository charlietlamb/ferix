"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { Button } from "@ferix/ui/components/ui/button";
import { Skeleton } from "@ferix/ui/components/ui/skeleton";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { formatTitle, getGithubAvatarUrl } from "@ferix/ui/lib/directories";
import { ArrowsClockwise, Check, Copy } from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  DirectoryFileTree,
  DirectoryFileTreeSkeleton,
} from "./directory-file-tree";
import { DirectoryTags } from "./directory-tags";

interface DirectoryContentProps {
  directoryId: string;
}

export function DirectoryContent({ directoryId }: DirectoryContentProps) {
  const t = useTranslations("pages.directory");
  const { isAdmin } = useAuthenticated();
  const [copied, setCopied] = useState(false);
  const triggerSync = useMutation(api.directories.triggerSync);

  const directory = useQuery(api.directories.get, {
    directoryId: directoryId as Id<"directories">,
  });

  const prompts = useQuery(api.prompts.listAllByDirectory, {
    directoryId: directoryId as Id<"directories">,
  });

  if (directory === undefined || prompts === undefined) {
    return <DirectoryContentSkeleton />;
  }

  if (directory === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">{t("notFound")}</div>
      </div>
    );
  }

  const ownerTitle = formatTitle(directory.owner);
  const command = `npx skills add ${directory.owner}/${directory.repo}`;
  const githubAvatarUrl = getGithubAvatarUrl(directory.owner);
  const githubRepoUrl = `https://github.com/${directory.owner}/${directory.repo}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyError"));
    }
  };

  const handleSync = async () => {
    try {
      await triggerSync({
        directoryId: directoryId as Id<"directories">,
      });
      toast.success(t("syncStarted"));
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("already in progress")) {
          toast.error(t("syncInProgress"));
        } else {
          toast.error(t("syncError"));
        }
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader className="flex flex-row items-center justify-between border-border border-b">
        <div>
          <PageHeaderTitle>{ownerTitle}</PageHeaderTitle>
          <PageHeaderDescription>
            {t("description", { owner: directory.owner, repo: directory.repo })}
          </PageHeaderDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
            <code className="font-mono text-sm">{command}</code>
            <Button
              className="size-7"
              onClick={handleCopy}
              size="icon"
              variant="ghost"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          {isAdmin && (
            <Button
              disabled={directory.syncStatus === "syncing"}
              onClick={handleSync}
              size="sm"
              variant="outline"
            >
              <ArrowsClockwise
                className={`size-4 ${directory.syncStatus === "syncing" ? "animate-spin" : ""}`}
              />
              <span className="ml-1.5">
                {directory.syncStatus === "syncing" ? t("syncing") : t("sync")}
              </span>
            </Button>
          )}
          <a href={githubRepoUrl} rel="noopener noreferrer" target="_blank">
            <img
              alt={directory.owner}
              className="size-6 transition-opacity hover:opacity-80"
              height={24}
              src={githubAvatarUrl}
              width={24}
            />
          </a>
        </div>
      </PageHeader>
      {isAdmin && (
        <DirectoryTags directoryId={directoryId} tags={directory.tags ?? []} />
      )}
      <DirectoryFileTree prompts={prompts} />
    </div>
  );
}

/**
 * Skeleton for the directory header section
 */
function DirectoryHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between border-border border-b px-4 py-2">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="size-7 rounded" />
        </div>
        <Skeleton className="size-6 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Full skeleton for the directory page while loading
 */
export function DirectoryContentSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <DirectoryHeaderSkeleton />
      <DirectoryFileTreeSkeleton />
    </div>
  );
}
