import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      isLoading = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const sizeStyles = {
      xs: 'px-2.5 py-1 text-[11px] gap-1.5',
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-xs gap-2',
      lg: 'px-5 py-2.5 text-sm gap-2.5',
    };

    const variantStyles = {
      primary:
        'bg-[#064e3b] text-white hover:bg-[#053d2e] border border-[#043326] shadow-xs active:bg-[#03291f]',
      secondary:
        'bg-[#f4f3ef] text-[#141d24] hover:bg-[#eae8e1] border border-[#e6e4dc] active:bg-[#dedcd3]',
      outline:
        'bg-white text-[#141d24] hover:bg-[#fbfbfa] border border-[#d8d5cb] hover:border-[#b5b1a2] shadow-2xs',
      ghost:
        'bg-transparent text-[#52606d] hover:text-[#141d24] hover:bg-[#f4f3ef] border border-transparent',
      danger:
        'bg-[#fef2f2] text-[#991b1b] hover:bg-[#fee2e2] border border-[#fecaca] active:bg-[#fca5a5]',
      gold:
        'bg-[#d97706] text-white hover:bg-[#b45309] border border-[#92400e] shadow-xs',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && Icon && iconPosition === 'left' && <Icon className="w-3.5 h-3.5 shrink-0" />}
        <span>{children}</span>
        {!isLoading && Icon && iconPosition === 'right' && <Icon className="w-3.5 h-3.5 shrink-0" />}
      </button>
    );
  }
);

Button.displayName = 'Button';
