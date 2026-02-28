import { api } from "@ferix/server/_generated/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { convexServer } from "@/lib/convex";
import { McpDetailPageClient } from "./mcp-detail-page-client";

interface McpDetailPageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({
  params,
}: McpDetailPageProps): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  try {
    const server = await convexServer.query(api.mcpServers.getByName, {
      name: decodedName,
    });

    if (!server) {
      return { title: "MCP Server Not Found" };
    }

    const displayName = server.title || server.name;

    return {
      title: `${displayName} - MCP Server`,
      description:
        server.description ||
        `${displayName} MCP server for AI assistants. Tools and integrations for Claude, Cursor, and other AI agents.`,
      alternates: {
        canonical: `/mcp/${encodeURIComponent(server.name)}`,
      },
    };
  } catch {
    return { title: "MCP Server" };
  }
}

export default async function McpDetailPage({ params }: McpDetailPageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const server = await convexServer.query(api.mcpServers.getByName, {
    name: decodedName,
  });

  if (!server) {
    notFound();
  }

  return <McpDetailPageClient serverName={server.name} />;
}
