import type { Metadata } from "next";
import { UserPageClient } from "./user-page-client";

interface UserPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: UserPageProps): Promise<Metadata> {
  const { username } = await params;
  const description = `Browse AI agent skills and prompts shared by ${username} on Ferix. Discover their configurations for Claude, Cursor, and other AI assistants.`;

  return {
    title: `@${username}`,
    description,
    alternates: {
      canonical: `/user/${username}`,
    },
    openGraph: {
      title: `@${username}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `@${username}`,
      description,
    },
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = await params;
  return <UserPageClient username={username} />;
}
