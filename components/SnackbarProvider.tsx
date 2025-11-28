'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

type SnackbarVariant = 'success' | 'error' | 'info';

interface SnackbarState {
  id: number;
  message: string;
  variant: SnackbarVariant;
  duration: number;
}

interface SnackbarContextValue {
  showSnackbar: (message: string, options?: { variant?: SnackbarVariant; duration?: number }) => void;
  hideSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [visible, setVisible] = useState(false);

  const hideSnackbar = useCallback(() => {
    setVisible(false);
    setTimeout(() => setSnackbar(null), 200);
  }, []);

  const showSnackbar = useCallback(
    (message: string, options?: { variant?: SnackbarVariant; duration?: number }) => {
      setSnackbar({
        id: Date.now(),
        message,
        variant: options?.variant ?? 'info',
        duration: options?.duration ?? 4000,
      });
      setVisible(true);
    },
    [],
  );

  useEffect(() => {
    if (!snackbar) return;
    const timer = setTimeout(() => {
      hideSnackbar();
    }, snackbar.duration);
    return () => clearTimeout(timer);
  }, [snackbar, hideSnackbar]);

  const value = useMemo(
    () => ({
      showSnackbar,
      hideSnackbar,
    }),
    [showSnackbar, hideSnackbar],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {snackbar && (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-end justify-center pb-6">
          <div
            className={clsx(
              'flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl transition-all duration-200',
              visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              snackbar.variant === 'success' && 'bg-emerald-600',
              snackbar.variant === 'error' && 'bg-rose-600',
              snackbar.variant === 'info' && 'bg-slate-900',
            )}
          >
            {snackbar.message}
          </div>
        </div>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}
