'use client';

import {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  KeyboardEvent,
  ClipboardEvent,
} from 'react';
import { Input } from '@/components/common/input';
import { cn } from '@/libs/utils';

interface OTPInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  onEnter?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  type?: 'numeric' | 'alphanumeric';
}

export interface OTPInputRef {
  focus: () => void;
  clear: () => void;
  focusIndex: (index: number) => void;
}

export const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(
  (
    {
      length = 6,
      value = '',
      onChange,
      onComplete,
      onEnter,
      disabled = false,
      error = false,
      autoFocus = true,
      className,
      inputClassName,
      type = 'numeric',
    },
    ref,
  ) => {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        const firstEmptyIndex = otp.findIndex(digit => digit === '');
        const focusIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
        inputRefs.current[focusIndex]?.focus();
      },
      clear: () => {
        const emptyOtp = Array(length).fill('');
        setOtp(emptyOtp);
        onChange?.('');
        inputRefs.current[0]?.focus();
      },
      focusIndex: (index: number) => {
        if (index >= 0 && index < length) {
          inputRefs.current[index]?.focus();
        }
      },
    }));

    useEffect(() => {
      inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    useEffect(() => {
      if (value) {
        const otpArray = value.split('').slice(0, length);
        const paddedArray = [
          ...otpArray,
          ...Array(length - otpArray.length).fill(''),
        ];
        setOtp(paddedArray);
      }
    }, [value, length]);

    useEffect(() => {
      if (autoFocus && inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, [autoFocus]);

    const isValidChar = (char: string): boolean => {
      if (type === 'numeric') {
        return /^\d$/.test(char);
      }
      return /^[a-zA-Z0-9]$/.test(char);
    };

    const handleChange = (index: number, val: string) => {
      if (disabled) return;

      const char = val.slice(-1);

      if (val && !isValidChar(char)) return;

      const newOtp = [...otp];
      newOtp[index] = char;
      setOtp(newOtp);

      const otpString = newOtp.join('');
      onChange?.(otpString);

      if (char && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (char && index === length - 1 && newOtp.every(digit => digit !== '')) {
        onComplete?.(otpString);
      }
    };

    const handleKeyDown = (
      index: number,
      e: KeyboardEvent<HTMLInputElement>,
    ) => {
      if (disabled) return;

      if (e.key === 'Enter' && onEnter) {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length === length && otp.every(digit => digit !== '')) {
          onEnter?.(otpString);
        }
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();

        if (otp[index]) {
          const newOtp = [...otp];
          newOtp[index] = '';
          setOtp(newOtp);
          onChange?.(newOtp.join(''));
        } else if (index > 0) {
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          setOtp(newOtp);
          onChange?.(newOtp.join(''));
          inputRefs.current[index - 1]?.focus();
        }
      }

      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      }

      if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled) return;

      const pastedData = e.clipboardData.getData('text/plain').trim();

      const validChars = pastedData
        .split('')
        .filter(char => isValidChar(char))
        .slice(0, length);

      if (validChars.length === 0) return;

      const newOtp = [...otp];
      validChars.forEach((char, idx) => {
        if (idx < length) {
          newOtp[idx] = char;
        }
      });

      setOtp(newOtp);
      onChange?.(newOtp.join(''));

      const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();

      if (newOtp.every(digit => digit !== '')) {
        onComplete?.(newOtp.join(''));
      }
    };

    const handleFocus = (index: number) => {
      inputRefs.current[index]?.select();
    };

    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        {otp.map((digit, index) => (
          <Input
            key={index}
            ref={el => {
              inputRefs.current[index] = el;
            }}
            type={type === 'numeric' ? 'tel' : 'text'}
            inputMode={type === 'numeric' ? 'numeric' : 'text'}
            pattern={type === 'numeric' ? '[0-9]*' : '[a-zA-Z0-9]*'}
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            className={cn(
              'h-12 w-12 text-center text-lg font-semibold transition-all',
              'focus:ring-2 focus:ring-offset-2',
              error && 'border-red-500 focus:ring-red-500',
              !error && 'focus:ring-primary',
              disabled && 'cursor-not-allowed opacity-50',
              inputClassName,
            )}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>
    );
  },
);

OTPInput.displayName = 'OTPInput';
