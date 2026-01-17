import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sync all directories every hour
crons.interval(
  "sync directories",
  { hours: 1 },
  internal.directories.syncAllDirectories
);

export default crons;
