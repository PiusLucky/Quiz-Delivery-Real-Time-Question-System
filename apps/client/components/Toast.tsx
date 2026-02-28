"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

type ToastType = "success" | "error";

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void;
} | null>(null);

const DURATION = 3000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>({
    message: "",
    type: "success",
    visible: false,
  });

  const toast = useCallback((message: string, type: ToastType = "success") => {
    setState({ message, type, visible: true });
  }, []);

  useEffect(() => {
    if (!state.visible) return;
    const id = setTimeout(() => {
      setState((prev) => ({ ...prev, visible: false }));
    }, DURATION);
    return () => clearTimeout(id);
  }, [state.visible, state.message]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="toast-container"
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {state.visible && (
          <div
            className={`toast toast-${state.type}`}
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "8px",
              background: state.type === "success" ? "var(--success)" : "#ef4444",
              color: "#fff",
              fontWeight: 500,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              animation: "toastSlideIn 0.3s ease-out",
            }}
          >
            {state.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
