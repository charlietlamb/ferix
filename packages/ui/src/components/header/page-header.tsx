import { cn } from "@ferix/ui/lib/utils";

export function PageHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1 px-4 py-2", className)}>
      {children}
    </div>
  );
}

export function PageHeaderTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <h1 className={cn("text-lg", className)}>{children}</h1>;
}

export function PageHeaderDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("text-muted-foreground text-xs", className)}>{children}</p>
  );
}
