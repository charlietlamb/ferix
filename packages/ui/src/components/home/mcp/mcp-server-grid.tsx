"use client";

import { api } from "@ferix/server/_generated/api";
import { McpGridHeader } from "@ferix/ui/components/mcp/mcp-grid-header";
import {
  McpServerCell,
  McpServerCellSkeleton,
} from "@ferix/ui/components/mcp/mcp-server-cell";
import { getMcpGridItemBorderClasses } from "@ferix/ui/lib/mcp";
import { useQuery } from "convex/react";
import { motion } from "motion/react";

const STAGGER_DELAY = 0.03;

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * STAGGER_DELAY,
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0] as const,
    },
  }),
};

interface McpServer {
  _id: string;
  name: string;
  title: string;
  description?: string;
  version: string;
  repositoryUrl?: string;
  websiteUrl?: string;
  iconUrl?: string;
  packages: Array<{
    registryType: "npm" | "pypi";
    identifier: string;
    transport: "stdio" | "sse" | "streamable-http";
  }>;
  githubStars?: number;
  registryUpdatedAt: number;
}

interface McpServerGridInnerProps {
  servers: McpServer[];
}

function McpServerGridInner({ servers }: McpServerGridInnerProps) {
  return (
    <div>
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {servers.map((server, i) => (
          <motion.li
            animate="visible"
            className={getMcpGridItemBorderClasses(i, servers.length)}
            custom={i}
            initial="hidden"
            key={server._id}
            variants={itemVariants}
          >
            <McpServerCell heightClass="h-24" server={server} />
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function McpServerGridSkeleton() {
  return (
    <section className="flex flex-col border-border border-b">
      <McpGridHeader />
      <div className="grid grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div className={getMcpGridItemBorderClasses(i, 8)} key={i}>
            <McpServerCellSkeleton
              delay={i * STAGGER_DELAY}
              heightClass="h-24"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function McpServerGrid() {
  const servers = useQuery(api.mcpServers.getPopular, { limit: 8 });

  if (servers === undefined) {
    return <McpServerGridSkeleton />;
  }

  if (servers.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col border-border border-b">
      <McpGridHeader />
      <McpServerGridInner servers={servers} />
    </section>
  );
}
