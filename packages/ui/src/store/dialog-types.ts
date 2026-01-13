export interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "destructive" | "default";
  onConfirm: () => void | Promise<void>;
}
