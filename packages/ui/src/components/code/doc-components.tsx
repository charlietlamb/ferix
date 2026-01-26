import { cn } from "@ferix/ui/lib/utils";

interface DocCellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  showTitleBorder?: boolean;
}

export function DocCell({
  title,
  description,
  children,
  className,
  showTitleBorder = true,
}: DocCellProps) {
  return (
    <div className={cn("border-border border-r border-b", className)}>
      <div className="flex h-full flex-col">
        <div className={cn("p-4", showTitleBorder && "border-border border-b")}>
          <span className="text-sm">{title}</span>
        </div>
        <div className="flex-1 p-4">{children}</div>
        <div className="border-border border-t p-4">
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function Gutter() {
  return <div className="h-16 border-border border-b lg:col-span-6" />;
}
