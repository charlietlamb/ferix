"use client";

import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ferix/ui/components/ui/avatar";
import { useTranslations } from "next-intl";

interface UserProfile {
  _id: string;
  name: string;
  image: string | null;
  username?: string;
  displayUsername?: string;
  promptCount: number;
  totalDownloads: number;
}

interface UserProfileHeaderProps {
  user: UserProfile;
}

export function UserProfileHeader({ user }: UserProfileHeaderProps) {
  const t = useTranslations("pages.user");

  return (
    <PageHeader className="flex flex-row items-stretch justify-between border-border border-b p-0">
      <div className="flex items-center gap-4 px-4 py-2">
        <Avatar size="lg">
          {user.image && <AvatarImage alt={user.name} src={user.image} />}
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <PageHeaderTitle>{user.name}</PageHeaderTitle>
          <PageHeaderDescription>
            @{user.displayUsername ?? user.username}
          </PageHeaderDescription>
        </div>
      </div>
      <div className="flex items-stretch">
        <div className="flex flex-col justify-center border-border border-l px-4">
          <span className="font-medium">{user.promptCount}</span>
          <span className="text-muted-foreground text-xs uppercase">
            {t("prompts")}
          </span>
        </div>
        <div className="flex flex-col justify-center border-border border-l px-4">
          <span className="font-medium">
            {user.totalDownloads.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-xs uppercase">
            {t("downloads")}
          </span>
        </div>
      </div>
    </PageHeader>
  );
}
