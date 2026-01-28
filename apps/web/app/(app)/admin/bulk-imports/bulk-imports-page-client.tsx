"use client";

import { Link } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import { AdminBreadcrumbs } from "@ferix/ui/components/admin/admin-breadcrumbs";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import {
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import {
  scrapeSkillsFormDefaults,
  scrapeSkillsFormSchema,
} from "@ferix/ui/forms/admin/scrape-skills-form-schema";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { useAction, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { JobsList } from "./jobs-list";

export function BulkImportsPageClient() {
  const t = useTranslations("admin.bulkImports");

  const jobs = useQuery(api.bulkImport.listJobs, { limit: 20 });
  const pauseJob = useMutation(api.bulkImport.pauseJob);
  const resumeJob = useMutation(api.bulkImport.resumeJob);
  const scrapeSkillsSh = useAction(api.bulkImport.scrapeSkillsSh);

  const form = useAppForm({
    defaultValues: scrapeSkillsFormDefaults,
    validators: { onChange: scrapeSkillsFormSchema },
    onSubmit: async ({ value }) => {
      try {
        const limit = value.limit
          ? Number.parseInt(value.limit, 10)
          : undefined;
        const result = await scrapeSkillsSh({
          defaultTags: value.tags.length > 0 ? value.tags : undefined,
          limit: limit && limit > 0 ? limit : undefined,
        });
        const limitMsg = result.limitedTo
          ? ` (limited to ${result.limitedTo})`
          : "";
        toast.success(
          `Scraped ${result.scrapedUrls} repositories${limitMsg}. Job created with ${result.totalCount} valid URLs.`
        );
        form.reset();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to scrape skills.sh"
        );
      }
    },
  });

  const handlePause = async (jobId: string) => {
    try {
      await pauseJob({
        jobId: jobId as Parameters<typeof pauseJob>[0]["jobId"],
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to pause job");
    }
  };

  const handleResume = async (jobId: string) => {
    try {
      await resumeJob({
        jobId: jobId as Parameters<typeof resumeJob>[0]["jobId"],
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resume job");
    }
  };

  return (
    <AppPage>
      <div className="border-border border-b">
        <AdminBreadcrumbs current={t("title")} />
        <div className="flex flex-col gap-1 px-4 py-2">
          <PageHeaderTitle>{t("title")}</PageHeaderTitle>
          <PageHeaderDescription>{t("description")}</PageHeaderDescription>
        </div>
      </div>

      <div className="scrollbar-none flex h-full flex-col overflow-auto">
        <form
          className="flex flex-col gap-4 border-border border-b p-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div>
            <h3>
              {t("scrapeSkillsSh")}{" "}
              <Link
                className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                href="https://skills.sh"
                rel="noopener noreferrer"
                target="_blank"
              >
                skills.sh
              </Link>
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("scrapeDescription")}
            </p>
          </div>

          <form.AppField name="limit">
            {(field) => (
              <field.TextField
                label={t("importLimit")}
                placeholder={t("importLimitPlaceholder")}
                type="number"
              />
            )}
          </form.AppField>

          <form.AppField name="tags">
            {(field) => (
              <field.TagsField
                dropdownPosition="bottom"
                label={t("defaultTags")}
                placeholder={t("selectTags")}
              />
            )}
          </form.AppField>

          <form.AppForm>
            <form.SubmitButton label={t("scrapeAndImport")} />
          </form.AppForm>
        </form>

        <div className="flex flex-col">
          <div className="border-border border-b p-4">
            <h3 className="font-medium">{t("importJobs")}</h3>
          </div>
          <JobsList jobs={jobs} onPause={handlePause} onResume={handleResume} />
        </div>
      </div>
    </AppPage>
  );
}
