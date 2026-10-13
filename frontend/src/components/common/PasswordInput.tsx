import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, InputProps } from './Input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  matchState?: 'match' | 'mismatch' | 'idle';
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  matchState = 'idle',
  className = '',
  ...props
}) => {
  const [visible, setVisible] = useState(false);

  const ring =
    matchState === 'match'
      ? 'border-[#10b981] focus:border-[#059669] focus:ring-[#059669]/20'
      : matchState === 'mismatch'
      ? 'border-[#f87171] bg-[#fef2f2]/30 focus:border-[#dc2626] focus:ring-[#dc2626]/20'
      : '';

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        className={`pr-10 ${ring} ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-[#8896a4] hover:text-[#141d24] hover:bg-[#f4f3ef] transition-colors cursor-pointer"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};
