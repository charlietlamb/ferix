import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ferix/ui/components/ui/card";
import type { ReactNode } from "react";
import { Background } from "../brand/background";

interface FormCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormCard({ title, description, children }: FormCardProps) {
  return (
    <Card className="relative w-full max-w-sm rounded-none">
      <Background />
      <CardHeader className="z-10">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="z-10">{children}</CardContent>
    </Card>
  );
}
