"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { useTransition } from "react";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
};

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
}: ConfirmDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="border-border bg-secondary w-full max-w-sm rounded-2xl border p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-400">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="hover:bg-surface rounded-xl px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              startTransition(async () => {
                await onConfirm();
                onClose();
              });
            }}
            disabled={isPending}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-brand-500 hover:bg-brand-600"
            }`}
          >
            {isPending && (
              <Icon icon="mdi:loading" className="animate-spin text-lg" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
