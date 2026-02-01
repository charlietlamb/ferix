"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { DeviceCodeForm } from "@ferix/ui/components/auth/device/device-code-form";
import { FormCard } from "@ferix/ui/components/form/form-card";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function DevicePage() {
  const t = useTranslations("auth.device");
  const searchParams = useSearchParams();
  const router = useRouter();
  const userCode = searchParams.get("user_code");

  useEffect(() => {
    if (userCode) {
      const formattedCode = userCode.replace(/-/g, "").toUpperCase();
      if (formattedCode.length === 8) {
        router.push(`/device/approve?user_code=${formattedCode}`);
      }
    }
  }, [userCode, router]);

  const initialCode = userCode?.replace(/-/g, "").toUpperCase() ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center">
      <FormCard description={t("description")} title={t("title")}>
        <DeviceCodeForm initialCode={initialCode} />
      </FormCard>
    </div>
  );
}
