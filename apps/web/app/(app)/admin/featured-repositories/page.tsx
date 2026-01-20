import type { Metadata } from "next";
import { FeaturedRepositoriesPageClient } from "./featured-repositories-page-client";

export const metadata: Metadata = {
  title: "Featured Repositories | Admin",
  description: "Manage featured repositories on the home page",
  robots: { index: false, follow: false },
};

export default function FeaturedRepositoriesPage() {
  return <FeaturedRepositoriesPageClient />;
}
