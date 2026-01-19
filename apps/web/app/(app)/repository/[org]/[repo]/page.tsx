import { api } from "@ferix/server/_generated/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatName } from "@/app/api/og/shared";
import { convexServer } from "@/lib/convex";
import { buildOgMetadata } from "@/lib/og";
import { RepositoryPageClient } from "./repository-page-client";

interface RepositoryPageProps {
  params: Promise<{ org: string; repo: string }>;
}

export async function generateMetadata({
  params,
}: RepositoryPageProps): Promise<Metadata> {
  const { org, repo } = await params;

  try {
    const repository = await convexServer.query(
      api.directories.getByOwnerRepo,
      {
        owner: org,
        repo,
      }
    );

    if (!repository) {
      return { title: "Repository Not Found" };
    }

    const displayName = repository.name?.trim() || formatName(repository.owner);
    const promptCount = repository.promptCount ?? 0;

    return buildOgMetadata({
      title: `${displayName} - ${repository.repo}`,
      description: `${promptCount} skills from ${repository.owner}/${repository.repo} on Ferix`,
      ogPath: "/api/og/repository",
      params: {
        owner: repository.owner,
        repo: repository.repo,
        ...(repository.name && { name: repository.name }),
      },
    });
  } catch {
    return { title: "Repository" };
  }
}

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const { org, repo } = await params;

  const repository = await convexServer.query(api.directories.getByOwnerRepo, {
    owner: org,
    repo,
  });

  if (!repository) {
    notFound();
  }

  return <RepositoryPageClient repositoryId={repository._id} />;
}
