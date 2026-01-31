"use client";

import { authClient } from "@ferix/auth/client";
import { Button } from "@ferix/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ferix/ui/components/ui/card";
import { Input } from "@ferix/ui/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DeviceAuthPageProps {
  userCode?: string;
}

export function DeviceAuthPage({ userCode: initialCode }: DeviceAuthPageProps) {
  const router = useRouter();
  const [userCode, setUserCode] = useState(initialCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialCode) {
      handleSubmit().catch(() => undefined);
    }
  }, []);

  const formatCode = (code: string): string => {
    return code.trim().replace(/-/g, "").toUpperCase();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setIsLoading(true);

    const formattedCode = formatCode(userCode);
    if (!formattedCode) {
      setError("Please enter a device code");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authClient.device({
        query: { user_code: formattedCode },
      });

      if (response.data) {
        router.push(`/device/approve?user_code=${formattedCode}`);
      } else {
        setError("Invalid or expired code");
      }
    } catch {
      setError("Invalid or expired code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9-]/g, "");
    if (value.length === 4 && !value.includes("-")) {
      value = `${value}-`;
    }
    setUserCode(value);
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Device Authorization</CardTitle>
          <CardDescription>
            Enter the code displayed on your CLI to authorize this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Input
                autoComplete="off"
                autoFocus
                className="text-center font-mono text-2xl tracking-widest"
                maxLength={9}
                onChange={handleInputChange}
                placeholder="ABCD-1234"
                type="text"
                value={userCode}
              />
              {error && (
                <p className="text-center text-destructive text-sm">{error}</p>
              )}
            </div>
            <Button
              className="w-full"
              disabled={isLoading || userCode.length < 8}
              type="submit"
            >
              {isLoading ? "Verifying..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
