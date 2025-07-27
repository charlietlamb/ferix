import { Separator } from '@ferix/ui/components/shadcn/separator';

export function SettingsWrapper({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-4 pb-8">
      <div className="flex flex-col">
        <h1 className="font-bold text-lg">{title}</h1>
        <p className="text-base text-muted-foreground">{description}</p>
      </div>
      <Separator />
      {children}
    </div>
  );
}
