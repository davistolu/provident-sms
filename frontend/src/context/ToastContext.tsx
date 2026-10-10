import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { normalizeApiError, NormalizedApiError } from '@/services/errorService';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title?: string;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  action?: ToastAction;
  dismissible: boolean;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  show: (type: ToastType, message: string, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  error: (errorOrMessage: any, fallbackOrOptions?: string | ToastOptions, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  loading: (message: string, options?: ToastOptions) => string;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    },
    options?: ToastOptions
  ) => Promise<T>;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone global dispatcher for use outside React component tree
type ToastListener = (toasts: ToastItem[]) => void;
let globalToasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();
const recentMessages = new Map<string, number>();

function notifyListeners() {
  listeners.forEach((l) => l([...globalToasts]));
}

export const toast = {
  show: (type: ToastType, message: string, options?: ToastOptions): string => {
    const key = `${type}:${message}`;
    const now = Date.now();
    const lastSeen = recentMessages.get(key);

    // Prevent identical toast within 2 seconds
    if (lastSeen && now - lastSeen < 2000) {
      return '';
    }
    recentMessages.set(key, now);

    const id = `toast-${now}-${Math.random().toString(36).substr(2, 5)}`;
    const defaultDuration =
      type === 'loading'
        ? 0
        : type === 'error'
        ? 8000
        : type === 'warning'
        ? 6000
        : 4000;

    const item: ToastItem = {
      id,
      type,
      title: options?.title,
      message,
      duration: options?.duration ?? defaultDuration,
      action: options?.action,
      dismissible: options?.dismissible !== false,
      createdAt: now,
    };

    globalToasts = [item, ...globalToasts.slice(0, 4)]; // Max 5 toasts
    notifyListeners();

    if (item.duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, item.duration);
    }

    return id;
  },

  success: (message: string, options?: ToastOptions) => toast.show('success', message, options),

  error: (errorOrMessage: any, fallbackOrOptions?: string | ToastOptions, options?: ToastOptions) => {
    const resolvedOptions: ToastOptions | undefined =
      typeof fallbackOrOptions === 'object' ? fallbackOrOptions : options;
    const fallbackMessage = typeof fallbackOrOptions === 'string' ? fallbackOrOptions : undefined;

    let title = resolvedOptions?.title;
    let message = '';

    if (typeof errorOrMessage === 'string') {
      message = errorOrMessage;
      if (fallbackMessage && !title) {
        title = fallbackMessage;
      }
    } else {
      const normalized: NormalizedApiError = normalizeApiError(errorOrMessage);
      message = normalized.message || fallbackMessage || 'An unexpected error occurred.';
      if (fallbackMessage && !title) {
        title = fallbackMessage;
      } else if (!title && normalized.title && normalized.title !== 'Operation Failed') {
        title = normalized.title;
      }
    }

    return toast.show('error', message, { ...resolvedOptions, title });
  },

  warning: (message: string, options?: ToastOptions) => toast.show('warning', message, options),

  info: (message: string, options?: ToastOptions) => toast.show('info', message, options),

  loading: (message: string, options?: ToastOptions) => toast.show('loading', message, { ...options, duration: 0 }),

  promise: async <T,>(
    prom: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    },
    options?: ToastOptions
  ): Promise<T> => {
    const toastId = toast.loading(messages.loading, options);
    try {
      const result = await prom;
      toast.dismiss(toastId);
      const successMsg =
        typeof messages.success === 'function' ? messages.success(result) : messages.success;
      toast.success(successMsg, options);
      return result;
    } catch (err) {
      toast.dismiss(toastId);
      const errorMsg =
        typeof messages.error === 'function' ? messages.error(err) : messages.error;
      toast.error(errorMsg || err, options);
      throw err;
    }
  },

  dismiss: (id: string) => {
    globalToasts = globalToasts.filter((t) => t.id !== id);
    notifyListeners();
  },

  dismissAll: () => {
    globalToasts = [];
    notifyListeners();
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>(globalToasts);

  useEffect(() => {
    const handleUpdate = (updated: ToastItem[]) => {
      setToasts(updated);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const show = useCallback((type: ToastType, msg: string, opts?: ToastOptions) => toast.show(type, msg, opts), []);
  const success = useCallback((msg: string, opts?: ToastOptions) => toast.success(msg, opts), []);
  const error = useCallback(
    (err: any, fallbackOrOptions?: string | ToastOptions, opts?: ToastOptions) =>
      toast.error(err, fallbackOrOptions, opts),
    []
  );
  const warning = useCallback((msg: string, opts?: ToastOptions) => toast.warning(msg, opts), []);
  const info = useCallback((msg: string, opts?: ToastOptions) => toast.info(msg, opts), []);
  const loading = useCallback((msg: string, opts?: ToastOptions) => toast.loading(msg, opts), []);
  const promise = useCallback(
    <T,>(p: Promise<T>, msgs: any, opts?: ToastOptions) => toast.promise(p, msgs, opts),
    []
  );
  const dismiss = useCallback((id: string) => toast.dismiss(id), []);
  const dismissAll = useCallback(() => toast.dismissAll(), []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        show,
        success,
        error,
        warning,
        info,
        loading,
        promise,
        dismiss,
        dismissAll,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: globalToasts,
      show: toast.show,
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
      loading: toast.loading,
      promise: toast.promise,
      dismiss: toast.dismiss,
      dismissAll: toast.dismissAll,
    };
  }
  return context;
};
