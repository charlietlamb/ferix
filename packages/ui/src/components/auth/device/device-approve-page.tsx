"use client";

import { authClient, useSession } from "@ferix/auth/client";
import { Button } from "@ferix/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ferix/ui/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeviceApprovePageProps {
  userCode?: string;
}

export function DeviceApprovePage({ userCode }: DeviceApprovePageProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved" | "denied">(
    "pending"
  );
  const [error, setError] = useState<string | null>(null);

  if (!userCode) {
    router.push("/device");
    return null;
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session?.user) {
    const redirectUrl = encodeURIComponent(
      `/device/approve?user_code=${userCode}`
    );
    router.push(`/sign-in?callbackUrl=${redirectUrl}`);
    return null;
  }

  const handleApprove = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      await authClient.device.approve({
        userCode,
      });
      setStatus("approved");
    } catch {
      setError("Failed to approve device. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      await authClient.device.deny({
        userCode,
      });
      setStatus("denied");
    } catch {
      setError("Failed to deny device. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "approved") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600">
              Device Approved
            </CardTitle>
            <CardDescription>
              You can now close this window and return to the CLI.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">
              Device Denied
            </CardTitle>
            <CardDescription>
              The device authorization request has been denied.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Authorize Device</CardTitle>
          <CardDescription>
            A device is requesting access to your Ferix account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="mb-1 text-muted-foreground text-sm">Device Code</p>
            <p className="font-mono text-2xl tracking-widest">{userCode}</p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="mb-2 text-muted-foreground text-sm">Signed in as:</p>
            <p className="font-medium">{session.user.email}</p>
            {session.user.name && (
              <p className="text-muted-foreground text-sm">
                {session.user.name}
              </p>
            )}
          </div>

          {error && (
            <p className="text-center text-destructive text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1"
              disabled={isProcessing}
              onClick={handleDeny}
              variant="outline"
            >
              {isProcessing ? "..." : "Deny"}
            </Button>
            <Button
              className="flex-1"
              disabled={isProcessing}
              onClick={handleApprove}
            >
              {isProcessing ? "Approving..." : "Approve"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
