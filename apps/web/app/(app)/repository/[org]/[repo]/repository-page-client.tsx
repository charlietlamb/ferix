"use client";

import { AppPage } from "@ferix/ui/components/layout/app-page";
import { RepositoryContent } from "@ferix/ui/components/repositories/repository-content";

interface RepositoryPageClientProps {
  repositoryId: string;
}

export function RepositoryPageClient({
  repositoryId,
}: RepositoryPageClientProps) {
  return (
    <AppPage>
      <RepositoryContent repositoryId={repositoryId} />
    </AppPage>
  );
}
