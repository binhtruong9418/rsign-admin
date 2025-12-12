import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({
        className,
        variant = 'default',
        size = 'md',
        dot = false,
        children,
        ...props
    }, ref) => {
        const sizeClasses = {
            sm: 'px-2 py-0.5 text-xs',
            md: 'px-2.5 py-0.5 text-xs',
            lg: 'px-3 py-1 text-sm',
        };

        const variantClasses = {
            default: 'bg-secondary-100 text-secondary-800 border-secondary-200',
            primary: 'bg-primary-100 text-primary-800 border-primary-200',
            secondary: 'bg-secondary-100 text-secondary-800 border-secondary-200',
            success: 'bg-green-100 text-green-800 border-green-200',
            warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            danger: 'bg-red-100 text-red-800 border-red-200',
            info: 'bg-blue-100 text-blue-800 border-blue-200',
        };

        const dotClasses = {
            default: 'bg-secondary-500',
            primary: 'bg-primary-500',
            secondary: 'bg-secondary-500',
            success: 'bg-green-500',
            warning: 'bg-yellow-500',
            danger: 'bg-red-500',
            info: 'bg-blue-500',
        };

        if (dot) {
            return (
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border font-medium',
                        sizeClasses[size],
                        variantClasses[variant],
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[variant])} />
                    {children}
                </span>
            );
        }

        return (
            <span
                className={cn(
                    'inline-flex items-center rounded-full border font-medium',
                    sizeClasses[size],
                    variantClasses[variant],
                    className
                )}
                ref={ref}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';

export { Badge };