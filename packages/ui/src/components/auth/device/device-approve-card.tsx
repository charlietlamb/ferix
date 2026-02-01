"use client";

import { authClient } from "@ferix/auth/client";
import { Button } from "@ferix/ui/components/ui/button";
import { Spinner } from "@ferix/ui/components/ui/spinner";
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface DeviceApproveCardProps {
  userCode: string;
}

type ApprovalState = "pending" | "approved" | "denied" | "error";

function FinalStateCard({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {icon}
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

export function DeviceApproveCard({ userCode }: DeviceApproveCardProps) {
  const t = useTranslations("auth.device");
  const [state, setState] = useState<ApprovalState>("pending");
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const response = await authClient.device.approve({ userCode });

      if (response.error) {
        if (response.error.error === "device_code_already_processed") {
          toast.error(t("alreadyProcessed"));
        } else {
          toast.error(response.error.error_description ?? t("error"));
        }
        setState("error");
        setIsLoading(false);
        return;
      }

      setState("approved");
    } catch {
      toast.error(t("error"));
      setState("error");
      setIsLoading(false);
    }
  };

  const handleDeny = async () => {
    setIsLoading(true);
    try {
      const response = await authClient.device.deny({ userCode });

      if (response.error) {
        toast.error(response.error.error_description ?? t("error"));
        setState("error");
        setIsLoading(false);
        return;
      }

      setState("denied");
    } catch {
      toast.error(t("error"));
      setState("error");
      setIsLoading(false);
    }
  };

  if (state === "approved") {
    return (
      <FinalStateCard
        icon={
          <CheckCircleIcon className="size-12 text-foreground" weight="fill" />
        }
        text={t("success")}
      />
    );
  }

  if (state === "denied") {
    return (
      <FinalStateCard
        icon={<XCircleIcon className="size-12 text-foreground" weight="fill" />}
        text={t("denied")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border bg-muted/50 p-4 text-center">
        <p className="font-mono text-lg tracking-widest">
          {userCode.slice(0, 4)}-{userCode.slice(4)}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          className="flex-1"
          disabled={isLoading}
          onClick={handleDeny}
          variant="outline"
        >
          {t("deny")}
        </Button>
        <Button className="flex-1" disabled={isLoading} onClick={handleApprove}>
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              {t("processing")}
            </>
          ) : (
            t("approve")
          )}
        </Button>
      </div>
    </div>
  );
}
