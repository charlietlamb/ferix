import { cn } from "@ferix/ui/lib/utils";

const HEIGHT_MAP = {
  sm: "h-4",
  md: "h-8",
  lg: "h-16",
  xl: "h-24",
} as const;

interface GridDividerProps {
  height?: "sm" | "md" | "lg" | "xl";
  showVerticalLines?: boolean;
  className?: string;
}

export function GridDivider({
  height = "md",
  showVerticalLines = true,
  className,
}: GridDividerProps) {
  if (!showVerticalLines) {
    return (
      <div
        className={cn(
          "w-full border-border border-t",
          HEIGHT_MAP[height],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid w-full grid-cols-4 border-border border-t md:grid-cols-8",
        HEIGHT_MAP[height],
        className
      )}
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className={cn(
            index < 3 && "border-border border-r",
            index === 3 && "border-border border-r",
            index > 3 && index < 7 && "hidden border-border border-r md:block"
          )}
          key={index}
        />
      ))}
    </div>
  );
}
