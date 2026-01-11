import type { DialogEntry, DialogMap } from "@ferix/ui/store/dialog";
import { dialogStackAtom } from "@ferix/ui/store/dialog";
import { useAtom } from "jotai";

export function useDialog() {
  const [stack, setStack] = useAtom(dialogStackAtom);

  function open<K extends keyof DialogMap>(
    ...args: DialogMap[K] extends undefined
      ? [key: K]
      : [key: K, props: DialogMap[K]]
  ) {
    const [key, props] = args as [K, DialogMap[K]];
    setStack((prev) => [...prev, { key, props } as DialogEntry]);
  }

  function close() {
    setStack((prev) => prev.slice(0, -1));
  }

  function closeAll() {
    setStack([]);
  }

  return {
    open,
    close,
    closeAll,
    isOpen: stack.length > 0,
    current: stack.at(-1) ?? null,
    stack,
  };
}
