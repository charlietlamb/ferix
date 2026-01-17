"use client";

import { api } from "@ferix/server/_generated/api";
import { GithubRepoPreview } from "@ferix/ui/components/directories/github-repo-preview";
import { Button } from "@ferix/ui/components/ui/button";
import { Input } from "@ferix/ui/components/ui/input";
import { Label } from "@ferix/ui/components/ui/label";
import { Spinner } from "@ferix/ui/components/ui/spinner";
import { useGithubRepoValidation } from "@ferix/ui/hooks/use-github-repo-validation";
import {
  CheckCircleIcon,
  CircleNotchIcon,
  WarningCircleIcon,
  WarningIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  addDirectoryFormDefaults,
  addDirectoryFormSchema,
} from "./add-directory-form-schema";

interface AddDirectoryFormProps {
  onSuccess?: () => void;
}

const trailingSlashRegex = /\/$/;

export function AddDirectoryForm({ onSuccess }: AddDirectoryFormProps) {
  const t = useTranslations("addDirectory");
  const createDirectory = useMutation(api.directories.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [value, setValue] = useState(addDirectoryFormDefaults.githubUrl);

  const { status, repoData, error, setUrl } = useGithubRepoValidation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setUrl(newValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const result = addDirectoryFormSchema.safeParse({ githubUrl: value });
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || t("invalidUrl"));
      return;
    }

    if (status !== "valid") {
      toast.error(t("invalid"));
      return;
    }

    setIsSubmitting(true);
    try {
      await createDirectory({
        githubUrl: value.replace(trailingSlashRegex, ""),
      }); // Remove trailing slash
      toast.success(t("success"));
      onSuccess?.();
    } catch (err) {
      if (err instanceof Error && err.message.includes("already exists")) {
        toast.error(t("alreadyExists"));
      } else {
        toast.error(t("error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = status === "valid" && !isSubmitting;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="githubUrl">{t("githubUrl")}</Label>
        <div className="relative">
          <Input
            autoComplete="off"
            className="pr-10"
            id="githubUrl"
            onChange={handleChange}
            placeholder={t("githubUrlPlaceholder")}
            value={value}
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
              <XCircleIcon className="size-4 text-destructive" weight="fill" />
            )}
            {status === "conflict" && (
              <WarningIcon className="size-4 text-yellow-500" weight="fill" />
            )}
            {status === "error" && (
              <WarningCircleIcon
                className="size-4 text-destructive"
                weight="fill"
              />
            )}
          </div>
        </div>
        {value &&
          error &&
          (status === "invalid" ||
            status === "conflict" ||
            status === "error") && (
            <p className="text-destructive text-sm">{error}</p>
          )}
        {status === "checking" && value && (
          <p className="text-muted-foreground text-sm">{t("checking")}</p>
        )}
      </div>

      {status === "valid" && repoData && <GithubRepoPreview repo={repoData} />}

      <Button className="w-full" disabled={!canSubmit} type="submit">
        {isSubmitting ? (
          <>
            <Spinner className="mr-2" />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}
