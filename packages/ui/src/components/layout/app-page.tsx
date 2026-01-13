import { cn } from "@ferix/ui/lib/utils";

export function AppPage({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex h-full grow flex-col overflow-hidden", className)}>
      {children}
    </div>
  );
}
