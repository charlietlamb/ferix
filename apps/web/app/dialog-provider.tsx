"use client";

import { useDialog } from "@ferix/ui/hooks/use-dialog";
import {
  type DialogEntry,
  type DialogMap,
  type DialogProps,
  dialogRegistry,
} from "@ferix/ui/store/dialog";
import { useEffect, useRef, useState } from "react";

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const { stack } = useDialog();
  const [debouncedStack, setDebouncedStack] = useState<DialogEntry[]>([]);
  const prevStackLengthRef = useRef(stack.length);

  useEffect(() => {
    const isStackDecreasing = stack.length < prevStackLengthRef.current;
    prevStackLengthRef.current = stack.length;

    if (isStackDecreasing) {
      const timer = setTimeout(() => {
        setDebouncedStack(stack);
      }, 150);
      return () => clearTimeout(timer);
    }
    setDebouncedStack(stack);
  }, [stack]);

  return (
    <>
      {Object.entries(dialogRegistry).map(([key, Dialog]) => {
        const props = debouncedStack.find(
          (dialog: DialogEntry) => dialog.key === key
        )?.props;
        return (
          // @ts-expect-error doesn't like ... with undefined dialog props
          <Dialog key={key} {...(props as DialogProps<keyof DialogMap>)} />
        );
      })}
      {children}
    </>
  );
}
