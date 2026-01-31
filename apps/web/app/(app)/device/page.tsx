import { DeviceAuthorizationCard } from "@ferix/ui/components/auth/device/device-authorization-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authorize Device",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DevicePage() {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <DeviceAuthorizationCard />
    </div>
  );
}
