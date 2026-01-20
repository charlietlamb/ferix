"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { Button } from "@ferix/ui/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@ferix/ui/components/ui/empty";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Empty className="border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MagnifyingGlassIcon />
          </EmptyMedia>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>
            The page you're looking for doesn't exist or has been moved.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => router.push("/")} size="sm" variant="outline">
            Go back home
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
