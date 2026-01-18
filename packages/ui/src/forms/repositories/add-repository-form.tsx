"use client";

import { api } from "@ferix/server/_generated/api";
import { GithubRepoPreview } from "@ferix/ui/components/repositories/github-repo-preview";
import { Button } from "@ferix/ui/components/ui/button";
import { Input } from "@ferix/ui/components/ui/input";
import { Label } from "@ferix/ui/components/ui/label";
import { MultiSelect } from "@ferix/ui/components/ui/multi-select";
import { Spinner } from "@ferix/ui/components/ui/spinner";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { useGithubRepoValidation } from "@ferix/ui/hooks/use-github-repo-validation";
import { getTagsByIds, tagsToOptions } from "@ferix/ui/lib/tags";
import {
  CheckCircleIcon,
  CircleNotchIcon,
  WarningCircleIcon,
  WarningIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  addRepositoryFormDefaults,
  addRepositoryFormSchema,
} from "./add-repository-form-schema";

interface AddRepositoryFormProps {
  onSuccess?: () => void;
}

const trailingSlashRegex = /\/$/;

export function AddRepositoryForm({ onSuccess }: AddRepositoryFormProps) {
  const t = useTranslations("addRepository");
  const createRepository = useMutation(api.directories.create);
  const { status, repoData, error, setUrl } = useGithubRepoValidation();

  const tagOptions = useMemo(() => tagsToOptions(), []);

  const form = useAppForm({
    defaultValues: addRepositoryFormDefaults,
    validators: { onChange: addRepositoryFormSchema },
    onSubmit: async ({ value }) => {
      if (status !== "valid") {
        toast.error(t("invalid"));
        return;
      }

      try {
        await createRepository({
          githubUrl: value.githubUrl.replace(trailingSlashRegex, ""),
          tags: value.tags,
        });
        toast.success(t("success"));
        onSuccess?.();
      } catch (err) {
        console.error("Repository creation error:", err);
        if (err instanceof Error) {
          if (err.message.includes("already exists")) {
            toast.error(t("alreadyExists"));
          } else if (err.message.includes("Unauthorized")) {
            toast.error(t("unauthorized"));
          } else {
            toast.error(err.message || t("error"));
          }
        } else {
          toast.error(t("error"));
        }
      }
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField
        listeners={{
          onChange: ({ value }) => setUrl(value),
        }}
        name="githubUrl"
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="githubUrl">{t("githubUrl")}</Label>
            <div className="relative">
              <Input
                autoComplete="off"
                className="pr-10"
                id="githubUrl"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("githubUrlPlaceholder")}
                value={field.state.value}
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                {status === "checking" && (
                  <CircleNotchIcon className="size-4 animate-spin text-muted-foreground" />
                )}
                {status === "valid" && (
                  <CheckCircleIcon
                    className="size-4 text-green-500"
                    weight="fill"
                  />
                )}
                {status === "invalid" && (
                  <XCircleIcon
                    className="size-4 text-destructive"
                    weight="fill"
                  />
                )}
                {status === "conflict" && (
                  <WarningIcon
                    className="size-4 text-yellow-500"
                    weight="fill"
                  />
                )}
                {status === "error" && (
                  <WarningCircleIcon
                    className="size-4 text-destructive"
                    weight="fill"
                  />
                )}
              </div>
            </div>
            {field.state.value &&
              error &&
              (status === "invalid" ||
                status === "conflict" ||
                status === "error") && (
                <p className="text-destructive text-sm">{error}</p>
              )}
            {status === "checking" && field.state.value && (
              <p className="text-muted-foreground text-sm">{t("checking")}</p>
            )}
          </div>
        )}
      </form.AppField>

      {status === "valid" && repoData && <GithubRepoPreview repo={repoData} />}

      <form.AppField name="tags">
        {(field) => {
          const selectedTagOptions = getTagsByIds(field.state.value).map(
            (tag) => ({
              label: tag.label,
              value: tag.id,
              icon: tag.icon,
              group: tag.category,
            })
          );

          return (
            <div className="flex flex-col gap-2">
              <Label>{t("tags")}</Label>
              <MultiSelect
                dropdownPosition="top"
                groupBy
                onChange={(newTags) =>
                  field.handleChange(newTags.map((tag) => tag.value))
                }
                options={tagOptions}
                placeholder={t("tagsPlaceholder")}
                value={selectedTagOptions}
              />
              <p className="text-muted-foreground text-xs">{t("tagsHint")}</p>
            </div>
          );
        }}
      </form.AppField>

      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          canSubmit: state.canSubmit,
        })}
      >
        {({ isSubmitting, canSubmit }) => (
          <Button
            className="w-full"
            disabled={isSubmitting || !canSubmit || status !== "valid"}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
