import { cn } from "@ferix/ui/lib/utils";

interface GutterProps {
  className?: string;
}

export function Gutter({ className }: GutterProps) {
  return <div className={cn("h-16 border-border border-b", className)} />;
}
