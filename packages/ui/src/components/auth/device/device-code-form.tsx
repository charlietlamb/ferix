"use client";

import { authClient } from "@ferix/auth/client";
import { useRouter } from "@ferix/i18n/navigation";
import { Button } from "@ferix/ui/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@ferix/ui/components/ui/input-otp";
import { Spinner } from "@ferix/ui/components/ui/spinner";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface DeviceCodeFormProps {
  initialCode?: string;
}

export function DeviceCodeForm({ initialCode = "" }: DeviceCodeFormProps) {
  const t = useTranslations("auth.device");
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 8) {
      return;
    }

    setIsLoading(true);
    try {
      const formattedCode = code.toUpperCase();
      const response = await authClient.device({
        query: { user_code: formattedCode },
      });

      if (response.error) {
        toast.error(response.error.error_description ?? t("invalidCode"));
        setIsLoading(false);
        return;
      }

      if (response.data) {
        router.push(`/device/approve?user_code=${formattedCode}`);
      } else {
        toast.error(t("invalidCode"));
        setIsLoading(false);
      }
    } catch {
      toast.error(t("error"));
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const cleaned = value.replace(/-/g, "").toUpperCase();
    setCode(cleaned);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <InputOTP
        disabled={isLoading}
        maxLength={8}
        onChange={handleCodeChange}
        value={code}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
          <InputOTPSlot index={6} />
          <InputOTPSlot index={7} />
        </InputOTPGroup>
      </InputOTP>

      <Button
        className="w-full"
        disabled={code.length !== 8 || isLoading}
        onClick={handleVerify}
      >
        {isLoading ? (
          <>
            <Spinner className="mr-2" />
            {t("verifying")}
          </>
        ) : (
          t("continue")
        )}
      </Button>
    </div>
  );
}
