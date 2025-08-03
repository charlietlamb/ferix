import { cn } from '@ferix/ui/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted/80', className)}
      data-slot="skeleton"
      {...props}
    />
  );
}

export { Skeleton };
