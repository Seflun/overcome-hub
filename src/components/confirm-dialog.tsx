import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type Tone = "default" | "destructive";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

const ConfirmCtx = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        playSound("open");
        setPending({ ...opts, resolve });
      }),
    [],
  );

  const close = (v: boolean) => {
    playSound(v ? "complete" : "close");
    pending?.resolve(v);
    setPending(null);
  };


  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const tone: Tone = pending?.tone ?? "default";

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => close(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm animate-in fade-in zoom-in-95 slide-in-from-bottom-4 rounded-3xl border border-border/60 bg-card p-5 shadow-glow"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  tone === "destructive"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-primary/15 text-primary"
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold leading-tight">{pending.title}</h2>
                {pending.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{pending.description}</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => close(false)}
                className="flex-1 rounded-full border border-border/60 bg-background/40 px-4 py-2.5 text-sm font-semibold hover:bg-background/70"
              >
                {pending.cancelLabel ?? "Cancel"}
              </button>
              <button
                onClick={() => close(true)}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-bold shadow-glow ${
                  tone === "destructive"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {pending.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx;
}
