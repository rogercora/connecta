'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, iconLeft, iconRight, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const finalLeftIcon = leftIcon || iconLeft;
    const finalRightIcon = rightIcon || iconRight;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-bold text-zinc-800 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {finalLeftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              {finalLeftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-950 font-medium',
              'placeholder:text-zinc-400 placeholder:font-normal',
              'transition-all duration-150',
              'focus:outline-none focus:ring-4 focus:ring-offset-0',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/15'
                : 'border-zinc-200 focus:border-crimson-600 focus:ring-crimson-600/15',
              finalLeftIcon && 'pl-11',
              finalRightIcon && 'pr-11',
              'disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed',
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {finalRightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400">
              {finalRightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs font-semibold text-red-600">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-zinc-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
