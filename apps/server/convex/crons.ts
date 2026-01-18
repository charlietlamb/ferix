import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sync directories",
  { hours: 1 },
  internal.directories.syncAllDirectories
);

crons.interval("refresh stats", { minutes: 5 }, internal.stats.refreshStats);

export default crons;
