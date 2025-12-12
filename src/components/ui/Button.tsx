import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ComponentType<{ className?: string }>;
    rightIcon?: React.ComponentType<{ className?: string }>;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        className,
        variant = 'primary',
        size = 'md',
        isLoading = false,
        leftIcon: LeftIcon,
        rightIcon: RightIcon,
        children,
        disabled,
        ...props
    }, ref) => {
        const sizeClasses = {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4 text-sm',
            lg: 'h-12 px-6 text-base',
        };

        const variantClasses = {
            primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
            secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500',
            outline: 'border border-secondary-300 bg-white text-secondary-700 hover:bg-secondary-50 focus:ring-primary-500',
            ghost: 'bg-transparent text-secondary-700 hover:bg-secondary-100 focus:ring-secondary-500',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
        };

        const iconSizeClasses = {
            sm: 'h-3 w-3',
            md: 'h-4 w-4',
            lg: 'h-5 w-5',
        };

        const isDisabled = disabled || isLoading;

        return (
            <button
                className={cn(
                    // Base styles
                    'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',

                    // Size variants
                    sizeClasses[size],

                    // Style variants
                    variantClasses[variant],

                    className
                )}
                disabled={isDisabled}
                ref={ref}
                {...props}
            >
                {isLoading && (
                    <div className={cn(
                        'animate-spin border-2 border-current border-t-transparent rounded-full mr-2',
                        iconSizeClasses[size]
                    )} />
                )}

                {LeftIcon && !isLoading && (
                    <LeftIcon className={cn(iconSizeClasses[size], children && 'mr-2')} />
                )}

                {children}

                {RightIcon && !isLoading && (
                    <RightIcon className={cn(iconSizeClasses[size], children && 'ml-2')} />
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };