import { Badge } from "@ferix/ui/components/ui/badge";
import { Button } from "@ferix/ui/components/ui/button";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@ferix/ui/components/ui/progress";
import { PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { useTranslations } from "next-intl";
import { type JobStatus, jobStatusConfigs } from "./job-status";

export interface JobData {
  _id: string;
  status: JobStatus;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
}

interface JobItemProps {
  job: JobData;
  onPause: (jobId: string) => void;
  onResume: (jobId: string) => void;
}

export function JobItem({ job, onPause, onResume }: JobItemProps) {
  const t = useTranslations("admin.bulkImports");
  const progress = Math.round(
    ((job.completedCount + job.failedCount) / job.totalCount) * 100
  );
  const config = jobStatusConfigs[job.status];
  const formattedDate = format(job.createdAt, "MMM d, HH:mm");
  const resetTimeDistance = job.rateLimitReset
    ? formatDistanceToNowStrict(job.rateLimitReset * 1000)
    : null;

  return (
    <div className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <Badge variant={config.variant}>
          {config.icon}
          {t(`status.${job.status}`)}
        </Badge>
        <span className="text-muted-foreground text-xs">{formattedDate}</span>
      </div>

      <Progress value={progress}>
        <ProgressLabel>
          {job.completedCount} {t("progress.done")}
          {job.failedCount > 0 && (
            <span className="text-destructive">
              {" "}
              / {job.failedCount} {t("progress.failed")}
            </span>
          )}
        </ProgressLabel>
        <ProgressValue>
          {() => `${job.completedCount + job.failedCount} / ${job.totalCount}`}
        </ProgressValue>
      </Progress>

      {job.status === "running" && job.rateLimitRemaining !== undefined && (
        <div className="text-muted-foreground text-xs">
          {t("progress.rateLimit", { remaining: job.rateLimitRemaining })}
          {resetTimeDistance && job.rateLimitRemaining < 100 && (
            <span>
              {" "}
              ({t("progress.resetsIn", { time: resetTimeDistance })})
            </span>
          )}
        </div>
      )}

      {(job.status === "running" ||
        job.status === "pending" ||
        job.status === "paused") && (
        <div className="flex gap-2">
          {(job.status === "running" || job.status === "pending") && (
            <Button
              className="flex-1"
              onClick={() => onPause(job._id)}
              size="sm"
              variant="outline"
            >
              <PauseIcon weight="bold" />
              {t("actions.pause")}
            </Button>
          )}
          {job.status === "paused" && (
            <Button
              className="flex-1"
              onClick={() => onResume(job._id)}
              size="sm"
              variant="outline"
            >
              <PlayIcon weight="bold" />
              {t("actions.resume")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
