"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel: string;
  onConfirm: () => void;
  danger?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  cancelLabel = "취소",
  confirmLabel,
  onConfirm,
  danger = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
        {message && (
          <p className="text-sm text-muted-foreground text-center mt-1">
            {message}
          </p>
        )}
        <div className="flex gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className={`flex-1 ${danger ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
