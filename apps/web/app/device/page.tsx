import { DeviceAuthPage } from "@ferix/ui/components/auth/device/device-auth-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Device Authorization",
  description: "Authorize a device to access your Ferix account",
  robots: {
    index: false,
    follow: false,
  },
};

interface DevicePageProps {
  searchParams: Promise<{ user_code?: string }>;
}

export default async function DevicePage({ searchParams }: DevicePageProps) {
  const params = await searchParams;
  return <DeviceAuthPage userCode={params.user_code} />;
}
