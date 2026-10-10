import React from 'react';
import {
  CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2, X
} from 'lucide-react';
import { useToast, ToastItem, ToastType } from '@/context/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';
  const isInfo = toast.type === 'info';
  const isLoading = toast.type === 'loading';

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-[#064e3b] shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-[#e11d48] shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0" />,
    info: <Info className="w-4 h-4 text-[#2563eb] shrink-0" />,
    loading: <Loader2 className="w-4 h-4 text-[#064e3b] animate-spin shrink-0" />,
  };

  const borderAccents: Record<ToastType, string> = {
    success: 'border-[#a7f3d0] bg-[#ffffff]',
    error: 'border-[#fecdd3] bg-[#ffffff]',
    warning: 'border-[#fde68a] bg-[#ffffff]',
    info: 'border-[#bfdbfe] bg-[#ffffff]',
    loading: 'border-[#e5e3dc] bg-[#ffffff]',
  };

  const iconBg: Record<ToastType, string> = {
    success: 'bg-[#ecfdf5]',
    error: 'bg-[#fff1f2]',
    warning: 'bg-[#fffbeb]',
    info: 'bg-[#eff6ff]',
    loading: 'bg-[#f4f3ef]',
  };

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`pointer-events-auto w-full p-3.5 rounded-xl border shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${borderAccents[toast.type]}`}
    >
      <div className={`p-1.5 rounded-lg shrink-0 ${iconBg[toast.type]}`}>
        {icons[toast.type]}
      </div>

      <div className="flex-1 text-xs space-y-0.5 overflow-hidden">
        {toast.title && (
          <p className="font-bold text-[#141d24] leading-tight font-serif tracking-tight">
            {toast.title}
          </p>
        )}
        <p className="text-[#52606d] font-sans leading-relaxed break-words">
          {toast.message}
        </p>

        {toast.action && (
          <div className="pt-2">
            <button
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className="text-[11px] font-bold text-[#064e3b] hover:underline cursor-pointer"
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      {toast.dismissible && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="p-1 text-[#8c9ba5] hover:text-[#141d24] hover:bg-[#f4f3ef] rounded-md transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
