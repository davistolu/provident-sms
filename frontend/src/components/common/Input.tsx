import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="block text-[11px] font-bold text-[#52606d] uppercase tracking-wider">
              {label} {required && <span className="text-[#991b1b]">*</span>}
            </label>
          </div>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            required={required}
            className={`w-full px-3.5 py-2 text-xs text-[#141d24] bg-white border rounded-lg transition-colors placeholder:text-[#8896a4] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] ${
              error
                ? 'border-[#f87171] bg-[#fef2f2]/30 focus:border-[#dc2626] focus:ring-[#dc2626]/20'
                : 'border-[#d8d5cb] hover:border-[#b5b1a2]'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] font-medium text-[#991b1b]">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-[#8896a4]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
