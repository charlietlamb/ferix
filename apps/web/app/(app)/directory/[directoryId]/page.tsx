import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { notFound, redirect } from "next/navigation";
import { convexServer } from "@/lib/convex";

interface DirectoryPageProps {
  params: Promise<{ directoryId: string }>;
}

export default async function DirectoryRedirectPage({
  params,
}: DirectoryPageProps) {
  const { directoryId } = await params;

  try {
    const directory = await convexServer.query(api.directories.get, {
      directoryId: directoryId as Id<"directories">,
    });

    if (!directory) {
      notFound();
    }

    redirect(`/repository/${directory.owner}/${directory.repo}`);
  } catch {
    notFound();
  }
}
