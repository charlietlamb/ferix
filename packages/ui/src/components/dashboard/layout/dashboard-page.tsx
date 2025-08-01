import { cn } from '@ferix/ui/lib/utils';

export function DashboardPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('h-full p-4', className)}>{children}</div>;
}
