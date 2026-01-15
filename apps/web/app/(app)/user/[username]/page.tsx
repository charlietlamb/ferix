"use client";

import { api } from "@ferix/server/_generated/api";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import { UserProfileHeader } from "@ferix/ui/components/profile/user-profile-header";
import { UserProfileSkeleton } from "@ferix/ui/components/profile/user-profile-skeleton";
import {
  type ProfileTab,
  UserProfileTabs,
} from "@ferix/ui/components/profile/user-profile-tabs";
import { useQuery } from "convex/react";
import { notFound } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { use, useRef } from "react";

const profileTabs = ["created", "saved"] as const;

interface UserPageProps {
  params: Promise<{ username: string }>;
}

export default function UserPage({ params }: UserPageProps) {
  const { username } = use(params);
  const user = useQuery(api.profiles.getByUsername, { username });
  const hadUserRef = useRef(false);
  const [activeTab, setActiveTab] = useQueryState<ProfileTab>(
    "tab",
    parseAsStringLiteral(profileTabs).withDefault("created")
  );

  if (user === undefined) {
    return (
      <UserProfileSkeleton activeTab={activeTab} onTabChange={setActiveTab} />
    );
  }

  if (user) {
    hadUserRef.current = true;
  }

  if (user === null) {
    if (hadUserRef.current) {
      return (
        <UserProfileSkeleton activeTab={activeTab} onTabChange={setActiveTab} />
      );
    }
    notFound();
  }

  return (
    <AppPage>
      <UserProfileHeader user={user} />
      <UserProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userId={user._id}
      />
    </AppPage>
  );
}
