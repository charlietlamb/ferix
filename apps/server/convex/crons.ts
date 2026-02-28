import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Temporarily disabled - re-enable once GitHub token rate limiting is resolved
// crons.daily(
//   "sync directories",
//   { hourUTC: 4, minuteUTC: 0 },
//   internal.directories.syncAllDirectories
// );

crons.interval("refresh stats", { minutes: 5 }, internal.stats.refreshStats);

crons.interval(
  "sync skills.sh installs",
  { minutes: 10 },
  internal.skillsShCache.syncAllInstalls
);

// MCP Registry sync - full sync weekly on Sundays at 3:00 AM UTC
crons.weekly(
  "mcp full sync",
  { dayOfWeek: "sunday", hourUTC: 3, minuteUTC: 0 },
  internal.mcpSync.syncAllServers
);

// MCP Registry sync - incremental sync every 6 hours
crons.interval(
  "mcp incremental sync",
  { hours: 6 },
  internal.mcpSync.syncIncrementalServers
);

// MCP GitHub enrichment - daily at 5:00 AM UTC
crons.daily(
  "mcp github enrichment",
  { hourUTC: 5, minuteUTC: 0 },
  internal.mcpSync.enrichWithGitHubStars
);

export default crons;
