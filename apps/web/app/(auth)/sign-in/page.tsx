import { SignInCard } from "@ferix/ui/components/auth/sign-in/sign-in-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignInPage() {
  return <SignInCard />;
}
