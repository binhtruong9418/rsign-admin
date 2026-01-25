import { useState, useRef, useCallback } from 'react';
import { PDFDocument } from './PDFDocument';
import { PDFControls } from './PDFControls';
import { PDFZoneOverlay, type Zone } from './PDFZoneOverlay';
import { PDFZoneOverview } from './PDFZoneOverview';

export interface PDFViewerCompleteProps {
    fileUrl: string;
    zones?: Zone[];
    showZonesDefault?: boolean;
    maxHeight?: string;
    showControls?: boolean;
    showLegend?: boolean;
    onPageChange?: (page: number) => void;
    onZoomChange?: (scale: number) => void;
}

export function PDFViewerComplete({
    fileUrl,
    zones = [],
    showZonesDefault = false,
    maxHeight = '800px',  // Increased from 600px
    showControls = true,
    showLegend = true,
    onPageChange,
    onZoomChange
}: PDFViewerCompleteProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [showZones, setShowZones] = useState(showZonesDefault);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    const containerRef = useRef<HTMLDivElement>(null);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const onPageLoadSuccess = useCallback((page: any) => {
        // Get canvas element to track size
        const canvas = containerRef.current?.querySelector('canvas');
        if (canvas) {
            setCanvasSize({
                width: canvas.offsetWidth,
                height: canvas.offsetHeight
            });
        }
    }, []);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        onPageChange?.(page);
    };

    const handleScaleChange = (newScale: number) => {
        setScale(newScale);
        onZoomChange?.(newScale);
    };

    const hasZones = zones.length > 0;
    const pageZones = zones.filter(zone => zone.page === currentPage);

    return (
        <div className="space-y-4">
            {/* Zone Overview - Shows which pages have zones */}
            {hasZones && showZones && (
                <PDFZoneOverview
                    zones={zones}
                    currentPage={currentPage}
                    numPages={numPages}
                    onPageJump={handlePageChange}
                />
            )}

            {/* Controls */}
            {showControls && (
                <PDFControls
                    currentPage={currentPage}
                    numPages={numPages}
                    onPageChange={handlePageChange}
                    scale={scale}
                    onScaleChange={handleScaleChange}
                    showZones={showZones}
                    onToggleZones={() => setShowZones(prev => !prev)}
                    hasZones={hasZones}
                />
            )}

            {/* PDF Document */}
            <div
                className="border border-secondary-200 rounded-lg overflow-auto bg-secondary-50"
                style={{ maxHeight }}
            >
                <div className="flex justify-center p-4">
                    <div ref={containerRef} className="relative">
                        <PDFDocument
                            fileUrl={fileUrl}
                            currentPage={currentPage}
                            scale={scale}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onPageLoadSuccess={onPageLoadSuccess}
                        >
                            {/* Zone Overlay */}
                            {showZones && canvasSize.width > 0 && (
                                <PDFZoneOverlay
                                    zones={zones}
                                    currentPage={currentPage}
                                    canvasWidth={canvasSize.width}
                                    canvasHeight={canvasSize.height}
                                />
                            )}
                        </PDFDocument>
                    </div>
                </div>
            </div>

            {/* Zone Legend */}
            {showLegend && showZones && hasZones && (
                <div className="bg-secondary-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-secondary-900 mb-3">
                        Signature Zones on Page {currentPage}
                    </h4>
                    {pageZones.length === 0 ? (
                        <p className="text-sm text-secondary-600">
                            No signature zones on this page
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {pageZones.map((zone, index) => (
                                <div key={zone.id} className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded border-2 border-dashed"
                                        style={{
                                            borderColor: zone.color || '#2563eb',
                                            backgroundColor: zone.color ? `${zone.color}20` : '#2563eb20',
                                        }}
                                    />
                                    <span className="text-sm text-secondary-700">
                                        {zone.label || `Zone ${index + 1}`}
                                        {zone.assignedUser && (
                                            <span className="text-secondary-500 ml-1">
                                                - {zone.assignedUser.fullName || zone.assignedUser.email}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
