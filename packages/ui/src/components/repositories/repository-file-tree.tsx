"use client";

import { Link } from "@ferix/i18n/navigation";
import type { Prompt } from "@ferix/server/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ferix/ui/components/ui/collapsible";
import { Skeleton } from "@ferix/ui/components/ui/skeleton";
import { useInfiniteScroll } from "@ferix/ui/hooks/use-infinite-scroll";
import { extractDescription } from "@ferix/ui/lib/markdown";
import { formatTitle } from "@ferix/ui/lib/repositories";
import { cn } from "@ferix/ui/lib/utils";
import {
  ArrowRightIcon,
  CaretRightIcon,
  DownloadSimpleIcon,
  FolderOpenIcon,
  FolderSimpleIcon,
} from "@phosphor-icons/react";
import type { PaginationStatus } from "convex/browser";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Spinner } from "../ui/spinner";

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  prompt?: Prompt;
  children: FileTreeNode[];
}

interface RepositoryFileTreeProps {
  prompts: Prompt[];
  status: PaginationStatus;
  loadMore: () => void;
}

function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })
    .map((node) => ({
      ...node,
      children: sortNodes(node.children),
    }));
}

function insertPromptIntoTree(
  root: FileTreeNode[],
  prompt: Prompt,
  parts: string[]
): void {
  let currentLevel = root;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) {
      continue;
    }
    const isFile = i === parts.length - 1;
    const currentPath = parts.slice(0, i + 1).join("/");
    let existing = currentLevel.find((node) => node.name === part);
    if (!existing) {
      existing = {
        name: part,
        path: currentPath,
        type: isFile ? "file" : "folder",
        prompt: isFile ? prompt : undefined,
        children: [],
      };
      currentLevel.push(existing);
    }
    if (!isFile) {
      currentLevel = existing.children;
    }
  }
}

function buildFileTree(prompts: Prompt[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  for (const prompt of prompts) {
    const filePath = prompt.filePath;
    if (!filePath) {
      continue;
    }
    insertPromptIntoTree(root, prompt, filePath.split("/"));
  }
  return sortNodes(root);
}

interface FileRowProps {
  node: FileTreeNode;
  depth: number;
  isLast: boolean;
}

function FileRow({ node, depth, isLast }: FileRowProps) {
  const prompt = node.prompt;
  if (!prompt) {
    return null;
  }

  const fileName = node.name;
  const title = prompt.title.includes(" - ")
    ? prompt.title.split(" - ").slice(1).join(" - ")
    : prompt.title;
  const description = extractDescription(prompt.content);

  return (
    <div className={cn("border-border", !isLast && "border-b")}>
      <Link
        className="group flex items-center gap-2 px-4 py-1.5 transition-colors hover:bg-muted/50"
        href={`/prompt/${prompt.slug}`}
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-sm">{title}</span>
            <span className="shrink-0 font-mono text-muted-foreground/60 text-xs">
              {fileName}
            </span>
          </div>
          {description && (
            <span className="max-w-full truncate text-muted-foreground text-xs">
              {description}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {prompt.downloads > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <DownloadSimpleIcon className="size-3" />
              <span>{prompt.downloads}</span>
            </div>
          )}
          <ArrowRightIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </Link>
    </div>
  );
}

interface FolderRowProps {
  node: FileTreeNode;
  depth: number;
  isLast: boolean;
}

function FolderRow({ node, depth, isLast }: FolderRowProps) {
  const [isOpen, setIsOpen] = useState(true);
  const displayName = formatTitle(node.name);

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <div className={cn("border-border", (isOpen || !isLast) && "border-b")}>
        <CollapsibleTrigger
          className="flex h-10 w-full cursor-pointer items-center gap-2 bg-muted/30 px-4 transition-colors hover:bg-muted/50"
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          <CaretRightIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              isOpen && "rotate-90"
            )}
          />
          {isOpen ? (
            <FolderOpenIcon className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <FolderSimpleIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate font-medium text-sm">{displayName}</span>
          <span className="ml-auto text-muted-foreground text-xs">
            {node.children.length}
          </span>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className={cn("border-border", !isLast && "border-b")}>
          {node.children.map((child, i) => (
            <TreeNode
              depth={depth + 1}
              isLast={i === node.children.length - 1}
              key={child.path}
              node={child}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface TreeNodeProps {
  node: FileTreeNode;
  depth: number;
  isLast: boolean;
}

function TreeNode({ node, depth, isLast }: TreeNodeProps) {
  if (node.type === "folder") {
    return <FolderRow depth={depth} isLast={isLast} node={node} />;
  }
  return <FileRow depth={depth} isLast={isLast} node={node} />;
}

export function RepositoryFileTree({
  prompts,
  status,
  loadMore,
}: RepositoryFileTreeProps) {
  const t = useTranslations("components.repositoryFileTree");
  const tree = buildFileTree(prompts);

  const hasMore = status === "CanLoadMore";
  const isLoading = status === "LoadingMore";

  const loaderRef = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: loadMore,
    rootMargin: "200px",
  });

  if (tree.length === 0 && status === "Exhausted") {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <span className="text-muted-foreground text-sm">{t("noFiles")}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {tree.map((node, i) => (
        <TreeNode
          depth={0}
          isLast={i === tree.length - 1 && !hasMore && !isLoading}
          key={node.path}
          node={node}
        />
      ))}
      {(hasMore || isLoading) && (
        <div ref={loaderRef}>
          {isLoading ? <LoadingIndicator /> : <div className="h-px" />}
        </div>
      )}
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center py-6">
      <Spinner />
    </div>
  );
}

function FolderRowSkeleton({ depth }: { depth: number }) {
  return (
    <div className="border-border border-b">
      <div
        className="flex h-10 items-center gap-2 bg-muted/30 px-4"
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
      >
        <Skeleton className="size-4" />
        <Skeleton className="size-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="ml-auto h-3 w-6" />
      </div>
    </div>
  );
}

function FileRowSkeleton({ depth }: { depth: number }) {
  return (
    <div className="border-border border-b">
      <div
        className="flex items-center gap-2 px-4 py-1.5"
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </div>
  );
}

export function RepositoryFileTreeSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <FolderRowSkeleton depth={0} />
      <FileRowSkeleton depth={1} />
      <FileRowSkeleton depth={1} />
      <FileRowSkeleton depth={1} />
      <FolderRowSkeleton depth={0} />
      <FileRowSkeleton depth={1} />
      <FileRowSkeleton depth={1} />
      <FolderRowSkeleton depth={0} />
      <FolderRowSkeleton depth={1} />
      <FileRowSkeleton depth={2} />
      <FileRowSkeleton depth={2} />
      <FileRowSkeleton depth={1} />
      <FileRowSkeleton depth={1} />
      <FolderRowSkeleton depth={0} />
      <FileRowSkeleton depth={1} />
      <FileRowSkeleton depth={1} />
      <FileRowSkeleton depth={1} />
      <FolderRowSkeleton depth={0} />
      <FileRowSkeleton depth={1} />
      <FileRowSkeleton depth={1} />
      <FileRowSkeleton depth={0} />
      <FileRowSkeleton depth={0} />
    </div>
  );
}
