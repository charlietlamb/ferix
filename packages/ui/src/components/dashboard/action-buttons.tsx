'use client';

import DatePicker from '@ferix/ui/components/dashboard/date-picker';
import { Button } from '@ferix/ui/components/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@ferix/ui/components/shadcn/tooltip';
import { useIsMobile } from '@ferix/ui/hooks/use-mobile';
import { RiAddLine } from '@remixicon/react';

export function ActionButtons() {
  const isMobile = useIsMobile();

  return (
    <div className="flex gap-3">
      <DatePicker />
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="aspect-square max-lg:p-0">
              <RiAddLine
                aria-hidden="true"
                className="lg:-ms-1 size-5 opacity-40"
                size={20}
              />
              <span className="max-lg:sr-only">Add Subscription</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="lg:hidden" hidden={isMobile}>
            Add Subscription
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
