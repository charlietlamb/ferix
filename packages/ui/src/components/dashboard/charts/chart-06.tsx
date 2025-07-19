import { Badge } from '@ferix/ui/components/shadcn/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ferix/ui/components/shadcn/card';

export function Chart06() {
  return (
    <Card className="gap-5">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>New Subscribers</CardTitle>
            <div className="flex items-start gap-2">
              <div className="font-semibold text-2xl">26,864</div>
              <Badge className="mt-1.5 border-none bg-emerald-500/24 text-emerald-500">
                +3.4%
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-4"
              />
              <div className="text-[13px]/3 text-muted-foreground/50">
                Individual
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-1"
              />
              <div className="text-[13px]/3 text-muted-foreground/50">Team</div>
            </div>
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-6"
              />
              <div className="text-[13px]/3 text-muted-foreground/50">
                Enterprise
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex h-5 gap-1">
          <div className="h-full bg-chart-4" style={{ width: '22%' }} />
          <div
            className="h-full bg-linear-to-r from-chart-2 to-chart-1"
            style={{ width: '24%' }}
          />
          <div className="h-full bg-chart-6" style={{ width: '16%' }} />
          <div className="h-full bg-chart-3" style={{ width: '38%' }} />
        </div>
        <div>
          <div className="mb-3 text-[13px]/3 text-muted-foreground/50">
            Reason for upgrading
          </div>
          <ul className="divide-y divide-border text-sm">
            <li className="flex items-center gap-2 py-2">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-chart-4"
              />
              <span className="grow text-muted-foreground">
                Needed access to premium tools.
              </span>
              <span className="font-medium text-[13px]/3 text-foreground/70">
                4,279
              </span>
            </li>
            <li className="flex items-center gap-2 py-2">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-linear-to-r from-chart-2 to-chart-1"
              />
              <span className="grow text-muted-foreground">
                Enhanced assistance and protection.
              </span>
              <span className="font-medium text-[13px]/3 text-foreground/70">
                4,827
              </span>
            </li>
            <li className="flex items-center gap-2 py-2">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-chart-6"
              />
              <span className="grow text-muted-foreground">
                Faster, more reliable experience.
              </span>
              <span className="font-medium text-[13px]/3 text-foreground/70">
                3,556
              </span>
            </li>
            <li className="flex items-center gap-2 py-2">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-chart-3"
              />
              <span className="grow text-muted-foreground">
                Scaling up operations.
              </span>
              <span className="font-medium text-[13px]/3 text-foreground/70">
                6,987
              </span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
