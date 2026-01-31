"use client";

import { device, useSession } from "@ferix/auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "../../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

type AuthorizationStatus =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "denied"
  | "not-found";

export function DeviceAuthorizationCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading } = useSession();

  const prefillCode = searchParams.get("user_code") ?? "";
  const [userCode, setUserCode] = useState(prefillCode);
  const [status, setStatus] = useState<AuthorizationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleApprove = useCallback(async () => {
    if (!userCode.trim()) {
      setError("Please enter a code");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const result = await device.approve({ userCode: userCode.trim() });

      if (result.error) {
        if (result.error.message?.includes("not found")) {
          setStatus("not-found");
        } else {
          setStatus("error");
          setError(result.error.message ?? "Failed to authorize device");
        }
      } else {
        setStatus("success");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [userCode]);

  const handleDeny = useCallback(async () => {
    if (!userCode.trim()) {
      setError("Please enter a code");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const result = await device.deny({ userCode: userCode.trim() });

      if (result.error) {
        setStatus("error");
        setError(result.error.message ?? "Failed to deny device");
      } else {
        setStatus("denied");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [userCode]);

  const handleReset = useCallback(() => {
    setUserCode("");
    setStatus("idle");
    setError(null);
  }, []);

  if (sessionLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!session?.user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>
            You need to sign in to authorize this device.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/sign-in")}>
            Sign in
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-green-600">Device Authorized</CardTitle>
          <CardDescription>
            The device has been successfully authorized. You can close this page
            and return to the CLI.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => router.push("/")}
            variant="outline"
          >
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (status === "denied") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authorization Denied</CardTitle>
          <CardDescription>
            The device authorization request has been denied.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => router.push("/")}
            variant="outline"
          >
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (status === "not-found") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Code Not Found</CardTitle>
          <CardDescription>
            The device code was not found or has expired. Please try again with
            a new code from the CLI.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={handleReset} variant="outline">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Authorize Device</CardTitle>
        <CardDescription>
          Enter the code displayed in your CLI to authorize access to your
          account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userCode">Device Code</Label>
          <Input
            className="text-center font-mono text-lg tracking-widest"
            disabled={status === "loading"}
            id="userCode"
            maxLength={12}
            onChange={(e) => setUserCode(e.target.value.toUpperCase())}
            placeholder="Enter the code from CLI"
            value={userCode}
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <p className="text-muted-foreground text-sm">
          Signed in as <span className="font-medium">{session.user.email}</span>
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          className="flex-1"
          disabled={status === "loading" || !userCode.trim()}
          onClick={handleDeny}
          variant="outline"
        >
          Deny
        </Button>
        <Button
          className="flex-1"
          disabled={status === "loading" || !userCode.trim()}
          onClick={handleApprove}
        >
          {status === "loading" ? "Authorizing..." : "Authorize"}
        </Button>
      </CardFooter>
    </Card>
  );
}
