import { isAuthenticated } from "@ferix/auth/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await isAuthenticated()) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      {children}
    </div>
  );
}
