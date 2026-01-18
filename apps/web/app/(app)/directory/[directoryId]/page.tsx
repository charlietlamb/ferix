import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import type { Metadata } from "next";
import { convexServer } from "@/lib/convex";
import { buildOgMetadata } from "@/lib/og";
import { DirectoryPageClient } from "./directory-page-client";

interface DirectoryPageProps {
  params: Promise<{ directoryId: string }>;
}

export async function generateMetadata({
  params,
}: DirectoryPageProps): Promise<Metadata> {
  const { directoryId } = await params;

  try {
    const directory = await convexServer.query(api.directories.get, {
      directoryId: directoryId as Id<"directories">,
    });

    if (!directory) {
      return { title: "Directory Not Found" };
    }

    const prompts = await convexServer.query(api.prompts.listAllByDirectory, {
      directoryId: directoryId as Id<"directories">,
    });

    return buildOgMetadata({
      title: `${directory.owner}/${directory.repo}`,
      description: `${prompts.length} skills from ${directory.owner}/${directory.repo} on Ferix`,
      ogPath: "/api/og/directory",
      params: {
        owner: directory.owner,
        repo: directory.repo,
      },
    });
  } catch {
    return { title: "Directory" };
  }
}

export default async function DirectoryPage({ params }: DirectoryPageProps) {
  const { directoryId } = await params;
  return <DirectoryPageClient directoryId={directoryId} />;
}
