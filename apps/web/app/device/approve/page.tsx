import { DeviceApprovePage } from "@ferix/ui/components/auth/device/device-approve-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Approve Device",
  description: "Approve device access to your Ferix account",
  robots: {
    index: false,
    follow: false,
  },
};

interface DeviceApprovePageProps {
  searchParams: Promise<{ user_code?: string }>;
}

export default async function DeviceApprove({
  searchParams,
}: DeviceApprovePageProps) {
  const params = await searchParams;
  return <DeviceApprovePage userCode={params.user_code} />;
}
