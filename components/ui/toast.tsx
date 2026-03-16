"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; message: string; type: ToastType };

const ToastContext = React.createContext<{
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
} | null>(null);

let id = 0;
const DURATION = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const add = React.useCallback((message: string, type: ToastType) => {
    const currentId = ++id;
    setToasts((prev) => [...prev.slice(-2), { id: currentId, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== currentId));
    }, DURATION);
  }, []);
  const api = React.useMemo(
    () => ({
      success: (m: string) => add(m, "success"),
      error: (m: string) => add(m, "error"),
      info: (m: string) => add(m, "info"),
    }),
    [add]
  );
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-6 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ message, type }: { message: string; type: ToastType }) {
  const bg =
    type === "success"
      ? "bg-success/95 text-white border-success"
      : type === "error"
        ? "bg-destructive/95 text-white border-destructive"
        : "bg-primary/95 text-primary-foreground border-primary";
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm font-medium shadow-lg",
        bg
      )}
      role="alert"
    >
      {message}
    </div>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
