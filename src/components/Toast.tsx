"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface ToastContextType {
  show: (type: "success" | "error" | "info" | "warning", message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((type: "success" | "error" | "info" | "warning", message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const success = useCallback((message: string) => show("success", message), [show]);
  const error = useCallback((message: string) => show("error", message), [show]);
  const info = useCallback((message: string) => show("info", message), [show]);
  const warning = useCallback((message: string) => show("warning", message), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg shadow-lg text-white min-w-[200px] ${
              toast.type === "success" ? "bg-green-500" :
              toast.type === "error" ? "bg-red-500" :
              toast.type === "warning" ? "bg-yellow-500" :
              "bg-blue-500"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Legacy export for backwards compatibility
export const toast = {
  success: (message: string) => {
    if (typeof window !== "undefined") {
      (window as any).__toast?.success?.(message);
    }
  },
  error: (message: string) => {
    if (typeof window !== "undefined") {
      (window as any).__toast?.error?.(message);
    }
  },
  info: (message: string) => {
    if (typeof window !== "undefined") {
      (window as any).__toast?.info?.(message);
    }
  },
};
