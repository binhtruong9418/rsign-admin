import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownOption {
    value: string | number;
    label: string;
    disabled?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
}

export interface DropdownProps {
    options: DropdownOption[];
    value?: string | number;
    onValueChange?: (value: string | number) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    helperText?: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'filled' | 'outline';
    className?: string;
}

export function Dropdown({
    options,
    value,
    onValueChange,
    placeholder = 'Select an option...',
    label,
    error,
    helperText,
    disabled = false,
    size = 'md',
    variant = 'default',
    className,
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find(option => option.value === value);
    const dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`;

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

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setFocusedIndex(-1);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (disabled) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                    setFocusedIndex(0);
                } else {
                    setFocusedIndex(prev =>
                        prev < options.length - 1 ? prev + 1 : 0
                    );
                }
                break;

            case 'ArrowUp':
                event.preventDefault();
                if (isOpen) {
                    setFocusedIndex(prev =>
                        prev > 0 ? prev - 1 : options.length - 1
                    );
                }
                break;

            case 'Enter':
            case ' ':
                event.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else if (focusedIndex >= 0 && !options[focusedIndex]?.disabled) {
                    handleOptionSelect(options[focusedIndex].value);
                }
                break;

            case 'Escape':
                setIsOpen(false);
                setFocusedIndex(-1);
                triggerRef.current?.focus();
                break;

            case 'Tab':
                setIsOpen(false);
                setFocusedIndex(-1);
                break;
        }
    };

    const handleOptionSelect = (optionValue: string | number) => {
        onValueChange?.(optionValue);
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
    };

    const handleTriggerClick = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
                setFocusedIndex(value ? options.findIndex(opt => opt.value === value) : 0);
            }
        }
    };

    return (
        <div className={cn('relative w-full', className)} ref={dropdownRef}>
            {label && (
                <label
                    htmlFor={dropdownId}
                    className="block text-sm font-medium text-secondary-700 mb-2"
                >
                    {label}
                </label>
            )}

            <button
                ref={triggerRef}
                id={dropdownId}
                type="button"
                className={cn(
                    // Base styles
                    'flex w-full items-center justify-between rounded-lg border shadow-sm transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    'disabled:cursor-not-allowed disabled:opacity-50',

                    // Size variants
                    sizeClasses[size],

                    // Style variants
                    variantClasses[variant],

                    // Error state
                    error && 'border-red-300 focus:border-red-500 focus:ring-red-500',

                    // Open state
                    isOpen && 'ring-2 ring-primary-500 border-primary-500',
                )}
                onClick={handleTriggerClick}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${dropdownId}-error` : helperText ? `${dropdownId}-helper` : undefined}
            >
                <span className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && (
                        <selectedOption.icon className="h-4 w-4 text-secondary-500" />
                    )}
                    <span className={cn(
                        'truncate',
                        !selectedOption && 'text-secondary-500'
                    )}>
                        {selectedOption?.label || placeholder}
                    </span>
                </span>

                <ChevronDown className={cn(
                    'h-4 w-4 text-secondary-400 transition-transform duration-200',
                    isOpen && 'rotate-180'
                )} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-secondary-200 rounded-lg shadow-lg">
                    <ul
                        ref={listRef}
                        role="listbox"
                        className="max-h-60 overflow-auto py-1"
                        aria-labelledby={dropdownId}
                    >
                        {options.map((option, index) => (
                            <li
                                key={option.value}
                                role="option"
                                aria-selected={option.value === value}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors duration-150',
                                    'hover:bg-secondary-50',
                                    focusedIndex === index && 'bg-secondary-100',
                                    option.value === value && 'bg-primary-50 text-primary-700',
                                    option.disabled && 'opacity-50 cursor-not-allowed'
                                )}
                                onClick={() => !option.disabled && handleOptionSelect(option.value)}
                                onMouseEnter={() => setFocusedIndex(index)}
                            >
                                {option.icon && (
                                    <option.icon className="h-4 w-4 text-secondary-500" />
                                )}
                                <span className="truncate flex-1">{option.label}</span>
                                {option.value === value && (
                                    <Check className="h-4 w-4 text-primary-600" />
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {error && (
                <p
                    id={`${dropdownId}-error`}
                    className="mt-2 text-sm text-red-600"
                    role="alert"
                >
                    {error}
                </p>
            )}

            {helperText && !error && (
                <p
                    id={`${dropdownId}-helper`}
                    className="mt-2 text-sm text-secondary-600"
                >
                    {helperText}
                </p>
            )}
        </div>
    );
}