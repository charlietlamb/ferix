"use client";

import { useSession } from "@ferix/auth/client";
import { useRouter } from "@ferix/i18n/navigation";
import { DeviceApproveCard } from "@ferix/ui/components/auth/device/device-approve-card";
import { FormCard } from "@ferix/ui/components/form/form-card";
import { Spinner } from "@ferix/ui/components/ui/spinner";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function DeviceApprovePage() {
  const t = useTranslations("auth.device");
  const { data: session, isPending } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const userCode = searchParams.get("user_code");

  useEffect(() => {
    // Prioritize userCode check - redirect to code entry if missing
    if (!userCode) {
      router.push("/device");
      return;
    }

    // Then check authentication - redirect to login if not authenticated
    if (!(isPending || session)) {
      const returnUrl = `/device/approve?user_code=${userCode}`;
      router.push(`/sign-in?callbackURL=${encodeURIComponent(returnUrl)}`);
    }
  }, [session, isPending, userCode, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!(session && userCode)) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <FormCard description={t("approveDescription")} title={t("approveTitle")}>
        <DeviceApproveCard userCode={userCode} />
      </FormCard>
    </div>
  );
}
