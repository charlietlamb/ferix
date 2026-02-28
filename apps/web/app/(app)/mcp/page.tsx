import type { Metadata } from "next";
import { McpPageClient } from "./mcp-page-client";

export const metadata: Metadata = {
  title: "MCP Servers",
  description:
    "Discover MCP (Model Context Protocol) servers from the official registry. Browse tools and integrations for AI assistants.",
  alternates: {
    canonical: "/mcp",
  },
};

export default function McpPage() {
  return <McpPageClient />;
}
