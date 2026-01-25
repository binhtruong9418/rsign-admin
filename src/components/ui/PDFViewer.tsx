import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import '@/lib/pdf-worker';

export interface PDFViewerProps {
    fileUrl: string;
    zones?: Array<{
        id: string;
        page: number;
        position: {
            x: number;
            y: number;
            w: number;
            h: number;
        };
        label?: string;
        color?: string;
        assignedUser?: {
            fullName?: string;
            email: string;
        };
    }>;
    showZonesDefault?: boolean;
    maxHeight?: string;
}

export function PDFViewer({
    fileUrl,
    zones = [],
    showZonesDefault = false,
    maxHeight = '600px'
}: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [showZones, setShowZones] = useState(showZonesDefault);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const hasZones = zones.length > 0;
    const pageZones = zones.filter(zone => zone.page === currentPage);

    return (
        <div className="space-y-4">
            {/* PDF Controls */}
            <div className="flex items-center justify-between bg-secondary-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-secondary-700 min-w-[100px] text-center">
                        Page {currentPage} of {numPages || '...'}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(numPages || 1, prev + 1))}
                        disabled={currentPage >= (numPages || 1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-secondary-700 min-w-[60px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    {hasZones && (
                        <Button
                            variant={showZones ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setShowZones(prev => !prev)}
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
                </div>
            </div>

            {/* PDF Document */}
            <div
                className="border border-secondary-200 rounded-lg overflow-auto bg-secondary-50"
                style={{ maxHeight }}
            >
                <div className="flex justify-center p-4">
                    <div className="relative inline-block">
                        <Document
                            file={fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                                <div className="p-8 text-center text-secondary-600">
                                    Loading PDF...
                                </div>
                            }
                            error={
                                <div className="p-8 text-center text-red-600">
                                    Failed to load PDF
                                </div>
                            }
                        >
                            <Page
                                pageNumber={currentPage}
                                scale={scale}
                                renderTextLayer={true}
                                renderAnnotationLayer={false}
                                className="shadow-lg"
                            />
                        </Document>

                        {/* Signature Zones Overlay */}
                        {showZones && pageZones.map((zone) => (
                            <div
                                key={zone.id}
                                className={cn(
                                    "absolute border-2 border-dashed pointer-events-none transition-all",
                                    "bg-opacity-10"
                                )}
                                style={{
                                    left: `${zone.position.x}%`,
                                    top: `${zone.position.y}%`,
                                    width: `${zone.position.w}%`,
                                    height: `${zone.position.h}%`,
                                    borderColor: zone.color || '#2563eb',
                                    backgroundColor: zone.color ? `${zone.color}20` : '#2563eb20',
                                }}
                            >
                                <div
                                    className="absolute left-0 top-0 text-white text-[10px] px-1 py-0.5 rounded-br font-medium"
                                    style={{
                                        backgroundColor: zone.color || '#2563eb'
                                    }}
                                >
                                    {zone.label || zone.assignedUser?.fullName || 'Signature'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Zone Legend */}
            {showZones && hasZones && (
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
