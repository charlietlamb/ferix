import { useTranslations } from "next-intl";
import { type JobData, JobItem } from "./job-item";

interface JobsListProps {
  jobs: JobData[] | undefined;
  onPause: (jobId: string) => void;
  onResume: (jobId: string) => void;
}

export function JobsList({ jobs, onPause, onResume }: JobsListProps) {
  const t = useTranslations("admin.bulkImports");
  if (!jobs) {
    return (
      <div className="p-4 text-muted-foreground text-sm">{t("loading")}</div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="p-4 text-muted-foreground text-sm">{t("noJobsYet")}</div>
    );
  }

  return (
    <div className="-mr-px grid grid-cols-1 *:border-border *:border-r *:border-b md:grid-cols-2 xl:grid-cols-3">
      {jobs.map((job) => (
        <JobItem
          job={job}
          key={job._id}
          onPause={onPause}
          onResume={onResume}
        />
      ))}
    </div>
  );
}
