import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
    label?: string;
    error?: string;
    helperText?: string;
    variant?: 'default' | 'filled' | 'outline';
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({
        className,
        label,
        error,
        helperText,
        variant = 'default',
        resize = 'vertical',
        id,
        ...props
    }, ref) => {
        const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

        const variantClasses = {
            default: 'border-secondary-300 bg-white focus:border-primary-500 focus:ring-primary-500',
            filled: 'border-transparent bg-secondary-100 focus:bg-white focus:border-primary-500 focus:ring-primary-500',
            outline: 'border-2 border-secondary-200 bg-transparent focus:border-primary-500 focus:ring-0',
        };

        const resizeClasses = {
            none: 'resize-none',
            vertical: 'resize-y',
            horizontal: 'resize-x',
            both: 'resize',
        };

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-medium text-secondary-700 mb-2"
                    >
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <textarea
                    id={textareaId}
                    className={cn(
                        // Base styles
                        'flex w-full rounded-lg border shadow-sm transition-colors duration-200',
                        'px-3 py-2 text-sm placeholder:text-secondary-500',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'min-h-[80px]', // Default minimum height

                        // Resize behavior
                        resizeClasses[resize],

                        // Style variants
                        variantClasses[variant],

                        // Error state
                        error && 'border-red-300 focus:border-red-500 focus:ring-red-500',

                        className
                    )}
                    ref={ref}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
                    {...props}
                />

                {error && (
                    <p
                        id={`${textareaId}-error`}
                        className="mt-2 text-sm text-red-600"
                        role="alert"
                    >
                        {error}
                    </p>
                )}

                {helperText && !error && (
                    <p
                        id={`${textareaId}-helper`}
                        className="mt-2 text-sm text-secondary-600"
                    >
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

export { Textarea };