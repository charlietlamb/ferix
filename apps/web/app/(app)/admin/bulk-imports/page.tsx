import type { Metadata } from "next";
import { BulkImportsPageClient } from "./bulk-imports-page-client";

export const metadata: Metadata = {
  title: "Bulk Imports | Admin",
  description: "Import multiple GitHub repositories at once",
  robots: { index: false, follow: false },
};

export default function BulkImportsPage() {
  return <BulkImportsPageClient />;
}
