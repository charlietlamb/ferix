"use client";

import { DirectoryContent } from "@ferix/ui/components/directories/directory-content";
import { AppPage } from "@ferix/ui/components/layout/app-page";

interface DirectoryPageClientProps {
  directoryId: string;
}

export function DirectoryPageClient({ directoryId }: DirectoryPageClientProps) {
  return (
    <AppPage>
      <DirectoryContent directoryId={directoryId} />
    </AppPage>
  );
}
