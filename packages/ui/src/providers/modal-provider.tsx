'use client';

import { useModal } from '@ferix/ui/hooks/use-modal';
import {
  type ModalEntry,
  type ModalMap,
  type ModalProps,
  modalRegistry,
} from '@ferix/ui/store/modal';
import { useEffect, useRef, useState } from 'react';

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const { stack } = useModal();
  const [debouncedStack, setDebouncedStack] = useState<ModalEntry[]>([]);
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
      {Object.entries(modalRegistry).map(([key, Modal]) => {
        const props = debouncedStack.find(
          (modal: ModalEntry) => modal.key === key
        )?.props;
        return <Modal key={key} {...(props as ModalProps<keyof ModalMap>)} />;
      })}
      {children}
    </>
  );
}
