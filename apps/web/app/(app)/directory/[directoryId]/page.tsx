"use client";

import { DirectoryContent } from "@ferix/ui/components/directories/directory-content";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import { use } from "react";

interface DirectoryPageProps {
  params: Promise<{ directoryId: string }>;
}

export default function DirectoryPage({ params }: DirectoryPageProps) {
  const { directoryId } = use(params);

  return (
    <AppPage>
      <DirectoryContent directoryId={directoryId} />
    </AppPage>
  );
}
