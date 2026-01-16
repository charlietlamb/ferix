import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  rewrites: async () => [
    {
      source: "/ph/static/:path*",
      destination: "https://us-assets.i.posthog.com/static/:path*",
    },
    {
      source: "/ph/:path*",
      destination: "https://us.i.posthog.com/:path*",
    },
  ],
};

export default withNextIntl(nextConfig);
