import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@ferix/ui/components/shadcn/dialog';
import { useModal } from '@ferix/ui/hooks/use-modal';
import type { ModalKey } from '@ferix/ui/store/modal';

export function BaseDialog({
  title,
  description,
  modalKey,
  children,
}: {
  title: string;
  description: string;
  modalKey: ModalKey;
  children: React.ReactNode;
}) {
  const { close, stack } = useModal();

  const isOpen = stack.some((modal) => modal.key === modalKey);

  return (
    <Dialog onOpenChange={close} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
