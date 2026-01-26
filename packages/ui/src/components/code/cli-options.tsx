import type { CliOption } from "./types";

interface CliOptionsProps {
  options: readonly CliOption[];
  getTranslation: (key: string) => string;
}

export function CliOptions({ options, getTranslation }: CliOptionsProps) {
  return (
    <div className="-mx-4 -my-4 divide-y divide-border border-border border-t">
      {options.map(({ flag, key }) => (
        <div className="flex items-center gap-4 px-4 py-3" key={key}>
          <code className="shrink-0 font-mono text-foreground text-xs">
            {flag}
          </code>
          <span className="text-muted-foreground text-xs">
            {getTranslation(`option_${key}`)}
          </span>
        </div>
      ))}
    </div>
  );
}
