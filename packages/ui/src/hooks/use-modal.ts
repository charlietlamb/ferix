import type { ModalEntry, ModalMap } from '@ferix/ui/store/modal';
import { modalStackAtom } from '@ferix/ui/store/modal';
import { useAtom } from 'jotai';

export function useModal() {
  const [stack, setStack] = useAtom(modalStackAtom);

  function open<K extends keyof ModalMap>(key: K, props: ModalMap[K]) {
    setStack((prev) => [...prev, { key, props } as ModalEntry]);
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
