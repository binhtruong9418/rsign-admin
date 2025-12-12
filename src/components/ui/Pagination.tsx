import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showFirstLast?: boolean;
    showPrevNext?: boolean;
    maxVisiblePages?: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    showFirstLast = true,
    showPrevNext = true,
    maxVisiblePages = 5,
    size = 'md',
    className,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const sizeClasses = {
        sm: 'h-8 min-w-8 px-2 text-sm',
        md: 'h-9 min-w-9 px-3 text-sm',
        lg: 'h-10 min-w-10 px-4 text-base',
    };

    const iconSizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    // Calculate visible page numbers
    const getVisiblePages = (): (number | 'ellipsis')[] => {
        if (totalPages <= maxVisiblePages) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | 'ellipsis')[] = [];
        const halfVisible = Math.floor(maxVisiblePages / 2);

        if (currentPage <= halfVisible + 1) {
            // Show pages from start
            for (let i = 1; i <= maxVisiblePages - 1; i++) {
                pages.push(i);
            }
            if (maxVisiblePages < totalPages) {
                pages.push('ellipsis');
                pages.push(totalPages);
            }
        } else if (currentPage >= totalPages - halfVisible) {
            // Show pages from end
            pages.push(1);
            if (totalPages > maxVisiblePages) {
                pages.push('ellipsis');
            }
            for (let i = totalPages - maxVisiblePages + 2; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show pages around current
            pages.push(1);
            pages.push('ellipsis');

            for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
                pages.push(i);
            }

            pages.push('ellipsis');
            pages.push(totalPages);
        }

        return pages;
    };

    const visiblePages = getVisiblePages();

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            onPageChange(page);
        }
    };

    const PaginationButton = ({
        page,
        isActive = false,
        disabled = false,
        children,
        'aria-label': ariaLabel,
    }: {
        page?: number;
        isActive?: boolean;
        disabled?: boolean;
        children: React.ReactNode;
        'aria-label'?: string;
    }) => (
        <button
            className={cn(
                // Base styles
                'inline-flex items-center justify-center rounded-md border transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',

                // Size variants
                sizeClasses[size],

                // State variants
                isActive
                    ? 'bg-primary-600 border-primary-600 text-white hover:bg-primary-700'
                    : 'bg-white border-secondary-300 text-secondary-700 hover:bg-secondary-50 hover:border-secondary-400',

                disabled && 'hover:bg-white hover:border-secondary-300'
            )}
            onClick={() => page && handlePageChange(page)}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-current={isActive ? 'page' : undefined}
        >
            {children}
        </button>
    );

    return (
        <nav
            className={cn('flex items-center justify-center', className)}
            role="navigation"
            aria-label="Pagination Navigation"
        >
            <div className="flex items-center gap-1">
                {/* First Page Button */}
                {showFirstLast && currentPage > 1 && (
                    <PaginationButton
                        page={1}
                        disabled={currentPage === 1}
                        aria-label="Go to first page"
                    >
                        First
                    </PaginationButton>
                )}

                {/* Previous Page Button */}
                {showPrevNext && (
                    <PaginationButton
                        page={currentPage - 1}
                        disabled={currentPage === 1}
                        aria-label="Go to previous page"
                    >
                        <ChevronLeft className={iconSizeClasses[size]} />
                        <span className="sr-only">Previous</span>
                    </PaginationButton>
                )}

                {/* Page Numbers */}
                {visiblePages.map((page, index) => {
                    if (page === 'ellipsis') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className={cn(
                                    'inline-flex items-center justify-center text-secondary-500',
                                    sizeClasses[size]
                                )}
                                aria-hidden="true"
                            >
                                <MoreHorizontal className={iconSizeClasses[size]} />
                            </span>
                        );
                    }

                    return (
                        <PaginationButton
                            key={page}
                            page={page}
                            isActive={page === currentPage}
                            aria-label={`Go to page ${page}`}
                        >
                            {page}
                        </PaginationButton>
                    );
                })}

                {/* Next Page Button */}
                {showPrevNext && (
                    <PaginationButton
                        page={currentPage + 1}
                        disabled={currentPage === totalPages}
                        aria-label="Go to next page"
                    >
                        <ChevronRight className={iconSizeClasses[size]} />
                        <span className="sr-only">Next</span>
                    </PaginationButton>
                )}

                {/* Last Page Button */}
                {showFirstLast && currentPage < totalPages && (
                    <PaginationButton
                        page={totalPages}
                        disabled={currentPage === totalPages}
                        aria-label="Go to last page"
                    >
                        Last
                    </PaginationButton>
                )}
            </div>
        </nav>
    );
}

// Additional component for pagination info
export interface PaginationInfoProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    className?: string;
}

export function PaginationInfo({
    currentPage,
    totalItems,
    itemsPerPage,
    className,
}: PaginationInfoProps) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className={cn('text-sm text-secondary-600', className)}>
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
        </div>
    );
}