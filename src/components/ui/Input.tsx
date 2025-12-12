import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    variant?: 'default' | 'filled' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({
        className,
        type = 'text',
        label,
        error,
        helperText,
        leftIcon,
        rightIcon,
        variant = 'default',
        size = 'md',
        id,
        ...props
    }, ref) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

        const sizeClasses = {
            sm: 'h-9 px-3 text-sm',
            md: 'h-10 px-3 text-sm',
            lg: 'h-12 px-4 text-base',
        };

        const variantClasses = {
            default: 'border-secondary-300 bg-white focus:border-primary-500 focus:ring-primary-500',
            filled: 'border-transparent bg-secondary-100 focus:bg-white focus:border-primary-500 focus:ring-primary-500',
            outline: 'border-2 border-secondary-200 bg-transparent focus:border-primary-500 focus:ring-0',
        };

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-secondary-700 mb-2"
                    >
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        type={type}
                        id={inputId}
                        className={cn(
                            // Base styles
                            'flex w-full rounded-lg border shadow-sm transition-colors duration-200',
                            'placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                            'disabled:cursor-not-allowed disabled:opacity-50',

                            // Size variants
                            sizeClasses[size],

                            // Style variants
                            variantClasses[variant],

                            // Icon padding adjustments
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',

                            // Error state
                            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',

                            className
                        )}
                        ref={ref}
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                        {...props}
                    />

                    {rightIcon && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {error && (
                    <p
                        id={`${inputId}-error`}
                        className="mt-2 text-sm text-red-600"
                        role="alert"
                    >
                        {error}
                    </p>
                )}

                {helperText && !error && (
                    <p
                        id={`${inputId}-helper`}
                        className="mt-2 text-sm text-secondary-600"
                    >
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };