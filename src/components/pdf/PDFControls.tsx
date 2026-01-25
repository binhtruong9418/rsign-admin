import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export interface PDFControlsProps {
    // Pagination
    currentPage: number;
    numPages: number | null;
    onPageChange: (page: number) => void;
    isLoadingPage?: boolean;

    // Zoom
    scale: number;
    minScale?: number;
    maxScale?: number;
    onScaleChange: (scale: number) => void;

    // Toggles
    showZones?: boolean;
    onToggleZones?: () => void;
    hasZones?: boolean;

    // Additional controls
    additionalControls?: React.ReactNode;

    // Layout
    layout?: 'horizontal' | 'vertical';
}

export function PDFControls({
    currentPage,
    numPages,
    onPageChange,
    isLoadingPage = false,
    scale,
    minScale = 0.5,
    maxScale = 2.0,
    onScaleChange,
    showZones,
    onToggleZones,
    hasZones = false,
    additionalControls,
    layout = 'horizontal'
}: PDFControlsProps) {
    const [pageInput, setPageInput] = useState('');
    const [isEditingPage, setIsEditingPage] = useState(false);

    const handlePrevPage = () => onPageChange(Math.max(1, currentPage - 1));
    const handleNextPage = () => onPageChange(Math.min(numPages || 1, currentPage + 1));
    const handleZoomIn = () => onScaleChange(Math.min(maxScale, scale + 0.1));
    const handleZoomOut = () => onScaleChange(Math.max(minScale, scale - 0.1));
    const handleResetZoom = () => onScaleChange(1.0);

    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Only allow numbers
        if (value === '' || /^\d+$/.test(value)) {
            setPageInput(value);
        }
    };

    const handlePageInputSubmit = () => {
        const page = parseInt(pageInput);
        if (!isNaN(page) && page >= 1 && page <= (numPages || 1)) {
            onPageChange(page);
            setPageInput('');
            setIsEditingPage(false);
        }
    };

    const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handlePageInputSubmit();
        } else if (e.key === 'Escape') {
            setPageInput('');
            setIsEditingPage(false);
        }
    };

    const containerClass = layout === 'vertical'
        ? 'flex flex-col gap-3'
        : 'flex items-center justify-between';

    return (
        <div className={`bg-secondary-50 p-3 rounded-lg ${containerClass}`}>
            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1 || isLoadingPage}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {isEditingPage ? (
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            value={pageInput}
                            onChange={handlePageInputChange}
                            onKeyDown={handlePageInputKeyDown}
                            onBlur={handlePageInputSubmit}
                            placeholder={currentPage.toString()}
                            className="w-12 px-2 py-1 text-sm text-center border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                            autoFocus
                        />
                        <span className="text-sm text-secondary-700">/ {numPages || '...'}</span>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditingPage(true)}
                        className="text-sm text-secondary-700 hover:text-primary-600 transition-colors px-2 py-1 rounded hover:bg-secondary-100"
                        title="Click to jump to page"
                    >
                        Page {currentPage} of {numPages || '...'}
                        {isLoadingPage && <span className="ml-2 text-xs text-primary-600">Loading...</span>}
                    </button>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= (numPages || 1) || isLoadingPage}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={scale <= minScale}
                >
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-secondary-700 min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={scale >= maxScale}
                >
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetZoom}
                    title="Reset zoom to 100%"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>

            {/* Zone Toggle */}
            {hasZones && onToggleZones && (
                <Button
                    variant={showZones ? 'primary' : 'outline'}
                    size="sm"
                    onClick={onToggleZones}
                >
                    {showZones ? (
                        <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide Zones
                        </>
                    ) : (
                        <>
                            <Eye className="h-4 w-4 mr-2" />
                            Show Zones
                        </>
                    )}
                </Button>
            )}

            {/* Additional Controls */}
            {additionalControls}
        </div>
    );
}
