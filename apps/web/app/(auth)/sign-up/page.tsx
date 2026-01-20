import { SignUpCard } from "@ferix/ui/components/auth/sign-up/sign-up-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpPage() {
  return <SignUpCard />;
}
