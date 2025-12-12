import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label?: string;
    error?: string;
    helperText?: string;
    options: SelectOption[];
    placeholder?: string;
    variant?: 'default' | 'filled' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({
        className,
        label,
        error,
        helperText,
        options,
        placeholder,
        variant = 'default',
        size = 'md',
        id,
        ...props
    }, ref) => {
        const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

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
                        htmlFor={selectId}
                        className="block text-sm font-medium text-secondary-700 mb-2"
                    >
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    <select
                        id={selectId}
                        className={cn(
                            // Base styles
                            'flex w-full rounded-lg border shadow-sm transition-colors duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-offset-0 appearance-none cursor-pointer',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            'pr-10', // Space for chevron icon

                            // Size variants
                            sizeClasses[size],

                            // Style variants
                            variantClasses[variant],

                            // Error state
                            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',

                            className
                        )}
                        ref={ref}
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {/* Chevron Icon */}
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-secondary-400">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>

                {error && (
                    <p
                        id={`${selectId}-error`}
                        className="mt-2 text-sm text-red-600"
                        role="alert"
                    >
                        {error}
                    </p>
                )}

                {helperText && !error && (
                    <p
                        id={`${selectId}-helper`}
                        className="mt-2 text-sm text-secondary-600"
                    >
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

export { Select };