import { fetchAuthQuery } from "@ferix/auth/server";
import { redirect } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import { getLocale } from "next-intl/server";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await fetchAuthQuery(api.auth.getCurrentUser);

  if (!user || user.role !== "admin") {
    const locale = await getLocale();
    redirect({ href: "/", locale });
  }

  return children;
}
