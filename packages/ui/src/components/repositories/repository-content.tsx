"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import type { Prompt } from "@ferix/server/types";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { Button } from "@ferix/ui/components/ui/button";
import { Skeleton } from "@ferix/ui/components/ui/skeleton";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import {
  getGithubAvatarUrl,
  getRepositoryDisplayName,
} from "@ferix/ui/lib/repositories";
import { ArrowsClockwise, Check, Copy } from "@phosphor-icons/react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  RepositoryFileTree,
  RepositoryFileTreeSkeleton,
} from "./repository-file-tree";
import { RepositoryName } from "./repository-name";
import { RepositorySidebar } from "./repository-sidebar";
import { RepositoryTags } from "./repository-tags";

interface RepositoryContentProps {
  repositoryId: string;
}

export function RepositoryContent({ repositoryId }: RepositoryContentProps) {
  const t = useTranslations("pages.repository");
  const { isAdmin } = useAuthenticated();
  const [copied, setCopied] = useState(false);
  const triggerSync = useMutation(api.directories.triggerSync);

  const repository = useQuery(api.directories.get, {
    directoryId: repositoryId as Id<"directories">,
  });

  const {
    results: promptResults,
    status: promptsStatus,
    loadMore,
  } = usePaginatedQuery(
    api.prompts.list,
    { directoryId: repositoryId as Id<"directories"> },
    { initialNumItems: 50 }
  );

  const prompts = useMemo(
    () => (promptResults ?? []) as Prompt[],
    [promptResults]
  );

  const isLoading =
    repository === undefined || promptsStatus === "LoadingFirstPage";

  if (isLoading) {
    return <RepositoryContentSkeleton />;
  }

  if (repository === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">{t("notFound")}</div>
      </div>
    );
  }

  const displayName = getRepositoryDisplayName(repository);
  const command = `npx skills add ${repository.owner}/${repository.repo}`;
  const githubAvatarUrl = getGithubAvatarUrl(repository.owner);
  const githubRepoUrl = `https://github.com/${repository.owner}/${repository.repo}`;

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
        directoryId: repositoryId as Id<"directories">,
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
          <PageHeaderTitle>{displayName}</PageHeaderTitle>
          <PageHeaderDescription>
            {t("description", {
              owner: repository.owner,
              repo: repository.repo,
            })}
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
              disabled={repository.syncStatus === "syncing"}
              onClick={handleSync}
              size="sm"
              variant="outline"
            >
              <ArrowsClockwise
                className={`size-4 ${repository.syncStatus === "syncing" ? "animate-spin" : ""}`}
              />
              <span className="ml-1.5">
                {repository.syncStatus === "syncing" ? t("syncing") : t("sync")}
              </span>
            </Button>
          )}
          <a href={githubRepoUrl} rel="noopener noreferrer" target="_blank">
            <img
              alt={repository.owner}
              className="size-6 transition-opacity hover:opacity-80"
              height={24}
              src={githubAvatarUrl}
              width={24}
            />
          </a>
        </div>
      </PageHeader>
      {isAdmin && (
        <RepositoryName
          name={repository.name}
          owner={repository.owner}
          repositoryId={repositoryId}
        />
      )}
      {isAdmin && (
        <RepositoryTags
          repositoryId={repositoryId}
          tags={repository.tags ?? []}
        />
      )}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex-1 overflow-y-auto">
          <RepositoryFileTree
            loadMore={() => loadMore(50)}
            prompts={prompts}
            status={promptsStatus}
          />
        </div>
        <RepositorySidebar repository={repository} />
      </div>
    </div>
  );
}

function RepositoryHeaderSkeleton() {
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

function SidebarSectionSkeleton({
  children,
  border = true,
}: {
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 p-4 ${border ? "border-border border-b" : ""}`}
    >
      <Skeleton className="h-3 w-20" />
      {children}
    </div>
  );
}

function RepositorySidebarSkeleton() {
  return (
    <aside className="flex flex-col overflow-auto border-border border-t md:w-[320px] md:shrink-0 md:border-t-0 md:border-l">
      <SidebarSectionSkeleton>
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto size-4" />
        </div>
      </SidebarSectionSkeleton>
      <SidebarSectionSkeleton>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-14" />
            </div>
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      </SidebarSectionSkeleton>
      <SidebarSectionSkeleton>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-14" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </SidebarSectionSkeleton>
      <SidebarSectionSkeleton>
        <Skeleton className="h-6 w-12 rounded-full" />
      </SidebarSectionSkeleton>
      <SidebarSectionSkeleton border={false}>
        <Skeleton className="h-9 w-full rounded-md" />
      </SidebarSectionSkeleton>
    </aside>
  );
}

export function RepositoryContentSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <RepositoryHeaderSkeleton />
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex-1 overflow-y-auto">
          <RepositoryFileTreeSkeleton />
        </div>
        <RepositorySidebarSkeleton />
      </div>
    </div>
  );
}
