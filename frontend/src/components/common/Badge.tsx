import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'gold' | 'evergreen' | 'neutral' | 'indigo' | 'default';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    success: 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]',
    evergreen: 'bg-[#064e3b] text-white border border-[#043326]',
    warning: 'bg-[#fffbeb] text-[#92400e] border border-[#fde68a]',
    gold: 'bg-[#fef3c7] text-[#78350f] border border-[#fcd34d]',
    danger: 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]',
    neutral: 'bg-[#f4f3ef] text-[#52606d] border border-[#e6e4dc]',
    indigo: 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]',
    default: 'bg-[#f4f3ef] text-[#141d24] border border-[#d8d5cb]',
  };

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight rounded-md select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
