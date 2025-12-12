import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    className?: string;
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    className,
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
        full: 'max-w-full mx-4',
    };

    // Handle escape key
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    // Focus management
    useEffect(() => {
        if (!isOpen) return;

        // Store the currently focused element
        previousFocusRef.current = document.activeElement as HTMLElement;

        // Focus the modal
        const timer = setTimeout(() => {
            modalRef.current?.focus();
        }, 0);

        // Cleanup function
        return () => {
            clearTimeout(timer);
            // Restore focus to the previously focused element
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        };
    }, [isOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleOverlayClick = (event: React.MouseEvent) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={handleOverlayClick}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className={cn(
                    'relative w-full bg-white rounded-lg shadow-xl transform transition-all',
                    sizeClasses[size],
                    className
                )}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between p-6 border-b border-secondary-200">
                        <div className="flex-1">
                            {title && (
                                <h3
                                    id="modal-title"
                                    className="text-lg font-semibold text-secondary-900"
                                >
                                    {title}
                                </h3>
                            )}
                            {description && (
                                <p
                                    id="modal-description"
                                    className="mt-1 text-sm text-secondary-600"
                                >
                                    {description}
                                </p>
                            )}
                        </div>
                        {showCloseButton && (
                            <button
                                type="button"
                                className="ml-4 p-1 text-secondary-400 hover:text-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

// Modal sub-components for more structured content
export interface ModalHeaderProps {
    children: ReactNode;
    className?: string;
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
    return (
        <div className={cn('pb-4 border-b border-secondary-200 mb-6', className)}>
            {children}
        </div>
    );
}

export interface ModalBodyProps {
    children: ReactNode;
    className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
    return (
        <div className={cn('py-2', className)}>
            {children}
        </div>
    );
}

export interface ModalFooterProps {
    children: ReactNode;
    className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
    return (
        <div className={cn('pt-6 border-t border-secondary-200 mt-6 flex justify-end space-x-3', className)}>
            {children}
        </div>
    );
}