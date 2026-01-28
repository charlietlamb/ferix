import {
  CheckCircleIcon,
  ClockIcon,
  PauseIcon,
  PlayIcon,
  XCircleIcon,
} from "@phosphor-icons/react";

export const JOB_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "paused",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export interface JobStatusConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
}

export const jobStatusConfigs: Record<JobStatus, JobStatusConfig> = {
  pending: { variant: "outline", icon: <ClockIcon weight="bold" /> },
  running: { variant: "default", icon: <PlayIcon weight="bold" /> },
  completed: { variant: "secondary", icon: <CheckCircleIcon weight="bold" /> },
  failed: { variant: "destructive", icon: <XCircleIcon weight="bold" /> },
  paused: { variant: "outline", icon: <PauseIcon weight="bold" /> },
};
