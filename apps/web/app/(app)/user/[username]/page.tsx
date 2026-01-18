import type { Metadata } from "next";
import { UserPageClient } from "./user-page-client";

interface UserPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: UserPageProps): Promise<Metadata> {
  const { username } = await params;

  return {
    title: username,
    description: `Skills by ${username} on Ferix`,
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = await params;
  return <UserPageClient username={username} />;
}
