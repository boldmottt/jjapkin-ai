"use client";

/**
 * 토스트 렌더러 — 우측 하단 스택. layout에서 1회 마운트.
 */

import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore, type ToastType } from "@/stores/toast";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<ToastType, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-border bg-background text-foreground",
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-xs flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-lg",
              "animate-in slide-in-from-bottom-2 fade-in",
              STYLES[t.type],
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1 break-words">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
              aria-label="닫기"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
