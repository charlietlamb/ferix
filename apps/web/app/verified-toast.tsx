"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

export function VerifiedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("auth");

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      toast.success(t("emailVerified"));
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router, t]);

  return null;
}
