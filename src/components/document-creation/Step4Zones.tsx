import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, FileText, X, Eye, Square, Settings, ZoomIn, ZoomOut, Check, Trash2 } from 'lucide-react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import type { DocumentData, SignatureZone, Signer } from '@/types/document-creation';
import { PDF_OPTIONS } from '@/lib/pdf-worker';

interface Step4ZonesProps {
    documentData: DocumentData;
    updateDocumentData: (updates: Partial<DocumentData>) => void;
    onNext: () => void;
    onPrevious: () => void;
}

const SIGNER_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6B7280', // Gray
];

export function Step4Zones({ documentData, updateDocumentData, onNext, onPrevious }: Step4ZonesProps) {
    const [selectedSignerId, setSelectedSignerId] = useState<string | null>(null);
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingZone, setEditingZone] = useState<SignatureZone | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [scale, setScale] = useState(1.0);
    const [dragMode, setDragMode] = useState(false);
    const [showSizeControls, setShowSizeControls] = useState(false);
    const [isLoadingPdf, setIsLoadingPdf] = useState(true);
    const [isLoadingPage, setIsLoadingPage] = useState(false);

    // Store actual PDF page dimensions (in points/pixels) - independent of zoom/scale
    // Key is page number, value is { width, height } in PDF points
    const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());

    // Rectangle drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
    const [currentDrawing, setCurrentDrawing] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // Refs
    const pdfViewerRef = useRef<HTMLDivElement>(null);

    // Active signers - for INDIVIDUAL mode, use a special "all recipients" signer
    const activeSigners: Signer[] = documentData.type === 'INDIVIDUAL'
        ? [{ id: 'individual-all', userId: '', name: 'All Recipients', email: '', color: SIGNER_COLORS[0] }]
        : documentData.signers;

    // Auto-select first signer on mount
    useEffect(() => {
        if (activeSigners.length > 0 && !selectedSignerId) {
            setSelectedSignerId(activeSigners[0].id);
        }
    }, [activeSigners, selectedSignerId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Cleanup to prevent memory leaks
            setIsDrawing(false);
            setSelectedZones([]);
        };
    }, []);

    const currentZones = documentData.signatureZones.filter(zone => zone.page === currentPage);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setIsLoadingPdf(false);
    };

    const onDocumentLoadError = (error: Error) => {
        console.error('Error loading PDF:', error);
        if (error.message.includes('worker')) {
            toast.error('PDF worker failed to load. Please refresh the page.');
        } else if (error.message.includes('CORS')) {
            toast.error('PDF loading blocked by browser security.');
        } else {
            toast.error(`Failed to load PDF: ${error.message}`);
        }
    };

    // Capture actual PDF page dimensions when page loads
    // IMPORTANT: Get ORIGINAL dimensions at scale=1, not the rendered canvas size
    const onPageLoadSuccess = useCallback((page: any) => {
        // Get viewport at scale 1.0 to get original PDF dimensions in points
        // This ensures we have the true PDF coordinate space, not the rendered canvas size
        const viewport = page.getViewport({ scale: 1.0 });
        const width = viewport.width;
        const height = viewport.height;

        setPageDimensions(prev => {
            const newMap = new Map(prev);
            newMap.set(currentPage, { width, height });
            return newMap;
        });

        setIsLoadingPage(false);
    }, [currentPage]);

    // Sync pageDimensions to documentData whenever it changes
    useEffect(() => {
        if (pageDimensions.size > 0) {
            updateDocumentData({ pageDimensions });
        }
    }, [pageDimensions, updateDocumentData]);

    // Get relative point for drawing
    const getRelativePoint = useCallback((clientX: number, clientY: number) => {
        const pdfContainer = pdfViewerRef.current;
        if (!pdfContainer) return { x: 0, y: 0 };

        const canvas = pdfContainer.querySelector('canvas');
        if (canvas) {
            const canvasRect = canvas.getBoundingClientRect();
            return {
                x: Math.max(0, Math.min(clientX - canvasRect.left, canvas.offsetWidth)),
                y: Math.max(0, Math.min(clientY - canvasRect.top, canvas.offsetHeight))
            };
        }

        const rect = pdfContainer.getBoundingClientRect();
        return {
            x: Math.max(0, clientX - rect.left),
            y: Math.max(0, clientY - rect.top)
        };
    }, []);

    const normalizeSelection = useCallback((startX: number, startY: number, endX: number, endY: number) => {
        return {
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY)
        };
    }, []);

    const handleDrawingStart = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (!dragMode || !selectedSignerId) return;

        event.preventDefault();
        event.stopPropagation();

        const point = getRelativePoint(event.clientX, event.clientY);
        setIsDrawing(true);
        setDrawingStart(point);
        setCurrentDrawing({ x: point.x, y: point.y, width: 0, height: 0 });

        if (!event.ctrlKey && !event.metaKey) {
            setSelectedZones([]);
        }
    }, [dragMode, selectedSignerId, getRelativePoint]);

    const handleDrawingMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawing || !drawingStart) return;

        event.preventDefault();
        const point = getRelativePoint(event.clientX, event.clientY);
        const selection = normalizeSelection(drawingStart.x, drawingStart.y, point.x, point.y);
        setCurrentDrawing(selection);
    }, [isDrawing, drawingStart, getRelativePoint, normalizeSelection]);

    const handleDrawingEnd = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawing || !drawingStart || !currentDrawing || !selectedSignerId) return;

        event.preventDefault();
        event.stopPropagation();

        const minSize = 30;
        if (currentDrawing.width >= minSize && currentDrawing.height >= minSize) {
            // Get PDF page dimensions (actual PDF dimensions at scale 1.0)
            const pageSize = pageDimensions.get(currentPage);
            if (!pageSize) {
                toast.error('PDF page dimensions not loaded. Please wait for the page to fully load.');
                setIsDrawing(false);
                setDrawingStart(null);
                setCurrentDrawing(null);
                setDragMode(false);
                return;
            }

            // Get canvas element to get the current display size
            const pdfContainer = pdfViewerRef.current;
            const canvas = pdfContainer?.querySelector('canvas');
            if (!canvas) {
                toast.error('PDF canvas not found');
                setIsDrawing(false);
                setDrawingStart(null);
                setCurrentDrawing(null);
                setDragMode(false);
                return;
            }

            // Canvas displayed size (with current scale)
            const canvasWidth = canvas.offsetWidth;
            const canvasHeight = canvas.offsetHeight;

            // Convert drawing coordinates from canvas pixels to PDF page percentages
            // Step 1: Get position in canvas pixels (currentDrawing.x, currentDrawing.y)
            // Step 2: Convert to percentage of canvas (currentDrawing.x / canvasWidth)
            // Step 3: This percentage is the same as percentage of PDF page
            // Step 4: Multiply by 100 to store as 0-100 range
            // Because the canvas displays the PDF page proportionally
            const newZone: SignatureZone = {
                id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                signerId: selectedSignerId,
                page: currentPage,
                // Store as percentage of PDF page dimensions (0-100 range)
                // The canvas displays the PDF proportionally, so canvas percentage = PDF percentage
                x: (currentDrawing.x / canvasWidth) * 100,
                y: (currentDrawing.y / canvasHeight) * 100,
                width: (currentDrawing.width / canvasWidth) * 100,
                height: (currentDrawing.height / canvasHeight) * 100,
                label: undefined
            };

            updateDocumentData({
                signatureZones: [...documentData.signatureZones, newZone]
            });

            toast.success('Zone added successfully');
        }

        setIsDrawing(false);
        setDrawingStart(null);
        setCurrentDrawing(null);
        setDragMode(false);
    }, [isDrawing, drawingStart, currentDrawing, selectedSignerId, currentPage, pageDimensions, documentData.signatureZones, updateDocumentData]);

    const updateZone = (zoneId: string, updates: Partial<SignatureZone>) => {
        const updatedZones = documentData.signatureZones.map(zone =>
            zone.id === zoneId ? { ...zone, ...updates } : zone
        );
        updateDocumentData({ signatureZones: updatedZones });
    };

    const removeZone = (zoneId: string) => {
        const filteredZones = documentData.signatureZones.filter(zone => zone.id !== zoneId);
        updateDocumentData({ signatureZones: filteredZones });
        setSelectedZones(selectedZones.filter(id => id !== zoneId));
    };

    const clearAllZones = () => {
        updateDocumentData({ signatureZones: [] });
        setSelectedZones([]);
    };

    const selectZone = (zoneId: string, multiSelect = false) => {
        if (multiSelect) {
            setSelectedZones(prev =>
                prev.includes(zoneId)
                    ? prev.filter(id => id !== zoneId)
                    : [...prev, zoneId]
            );
        } else {
            setSelectedZones([zoneId]);
        }
    };

    const deleteSelectedZones = () => {
        const remainingZones = documentData.signatureZones.filter(
            zone => !selectedZones.includes(zone.id)
        );
        updateDocumentData({ signatureZones: remainingZones });
        setSelectedZones([]);
        toast.success(`Deleted ${selectedZones.length} zone(s)`);
    };

    const resizeSelectedZones = (width: number, height: number) => {
        // Get canvas size for normalization
        const pdfContainer = pdfViewerRef.current;
        const canvas = pdfContainer?.querySelector('canvas');
        if (!canvas) return;

        const canvasWidth = canvas.offsetWidth;
        const canvasHeight = canvas.offsetHeight;

        // Convert pixel sizes to percentage (0-100)
        // Canvas percentage = PDF page percentage (canvas displays PDF proportionally)
        const normalizedWidth = (width / canvasWidth) * 100;
        const normalizedHeight = (height / canvasHeight) * 100;

        const updatedZones = documentData.signatureZones.map(zone =>
            selectedZones.includes(zone.id)
                ? { ...zone, width: normalizedWidth, height: normalizedHeight }
                : zone
        );
        updateDocumentData({ signatureZones: updatedZones });
    };

    const getSignerById = (signerId: string) => {
        return activeSigners.find(s => s.id === signerId);
    };

    const getZonesForSigner = (signerId: string) => {
        return documentData.signatureZones.filter(zone => zone.signerId === signerId);
    };

    // Validation
    const canProceed = () => {
        if (documentData.type === 'INDIVIDUAL') {
            return documentData.signatureZones.length > 0;
        }

        // For SHARED mode, each signer must have at least one zone
        return activeSigners.every(signer =>
            documentData.signatureZones.some(zone => zone.signerId === signer.id)
        );
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Delete' && selectedZones.length > 0) {
                event.preventDefault();
                deleteSelectedZones();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                setSelectedZones([]);
                setDragMode(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedZones]);

    const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
    const resetZoom = () => setScale(1);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Place Signature Zones</h2>
                <p className="text-secondary-600">
                    {documentData.type === 'INDIVIDUAL'
                        ? 'Place signature zones that will be applied to all recipient documents. You can add multiple zones.'
                        : 'Place signature zones for each signer. Each signer can have multiple zones.'
                    }
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel - Signers & Tools */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Signers List */}
                    <Card className="p-4">
                        <h3 className="font-medium text-secondary-900 mb-3">
                            {documentData.type === 'INDIVIDUAL' ? 'Signature Zones' : 'Signers'}
                        </h3>
                        <div className="space-y-2">
                            {activeSigners.map(signer => {
                                const zonesCount = getZonesForSigner(signer.id).length;
                                const isSelected = selectedSignerId === signer.id;

                                return (
                                    <button
                                        key={signer.id}
                                        onClick={() => setSelectedSignerId(signer.id)}
                                        className={cn(
                                            'w-full p-3 rounded-lg border-2 text-left transition-all',
                                            isSelected
                                                ? 'border-primary-600 bg-primary-50'
                                                : 'border-secondary-200 hover:border-secondary-300'
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div
                                                className="w-3 h-3 rounded"
                                                style={{ backgroundColor: signer.color }}
                                            />
                                            <span className="font-medium text-sm">{signer.name}</span>
                                        </div>
                                        <div className="text-xs text-secondary-500">
                                            {zonesCount === 0 ? (
                                                <span className="text-red-600">⚠ No zones placed</span>
                                            ) : (
                                                <span className="text-green-600">✓ {zonesCount} zone{zonesCount > 1 ? 's' : ''}</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Tools */}
                    <Card className="p-4">
                        <h3 className="font-medium text-secondary-900 mb-3">Tools</h3>
                        <div className="space-y-2">
                            <Button
                                variant={dragMode ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    if (!selectedSignerId) {
                                        toast.error('Please select a signer first');
                                        return;
                                    }
                                    setDragMode(!dragMode);
                                    if (!dragMode) {
                                        setIsDrawing(false);
                                        setDrawingStart(null);
                                        setCurrentDrawing(null);
                                    }
                                }}
                                className="w-full justify-start"
                                disabled={!selectedSignerId}
                            >
                                <Square className="h-4 w-4 mr-2" />
                                {dragMode ? 'Drawing Mode (ON)' : 'Draw Rectangle'}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSizeControls(!showSizeControls)}
                                className="w-full justify-start"
                                disabled={selectedZones.length === 0}
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Size Controls
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearAllZones}
                                className="w-full justify-start text-red-600"
                                disabled={documentData.signatureZones.length === 0}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear All Zones
                            </Button>
                        </div>
                    </Card>

                    {/* Multi-Selection Controls */}
                    {selectedZones.length > 0 && (
                        <Card className="p-3">
                            <h4 className="font-medium text-secondary-900 mb-2">
                                Selected ({selectedZones.length})
                            </h4>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={deleteSelectedZones}
                                    className="w-full text-red-600"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Delete Selected
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Size Controls Panel */}
                    {showSizeControls && selectedZones.length > 0 && (
                        <Card className="p-3">
                            <h4 className="font-medium text-secondary-900 mb-2">Quick Sizes</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => resizeSelectedZones(150, 40)}
                                    className="text-xs"
                                >
                                    Small
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => resizeSelectedZones(200, 50)}
                                    className="text-xs"
                                >
                                    Standard
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => resizeSelectedZones(250, 60)}
                                    className="text-xs"
                                >
                                    Large
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => resizeSelectedZones(300, 80)}
                                    className="text-xs"
                                >
                                    Extra Large
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Panel - PDF Viewer */}
                <div className="lg:col-span-9 space-y-4">
                    {/* PDF Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsLoadingPage(true);
                                    setCurrentPage(prev => Math.max(1, prev - 1));
                                }}
                                disabled={currentPage === 1 || isLoadingPage}
                            >
                                ◀
                            </Button>
                            <span className="text-sm text-secondary-600">
                                Page {currentPage} of {numPages || '?'}
                                {isLoadingPage && <span className="ml-2 text-xs text-primary-600">Loading...</span>}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsLoadingPage(true);
                                    setCurrentPage(prev => Math.min(numPages || 1, prev + 1));
                                }}
                                disabled={currentPage === numPages || isLoadingPage}
                            >
                                ▶
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-secondary-600">Zoom: {Math.round(scale * 100)}%</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={zoomOut}
                                disabled={scale <= 0.5}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={resetZoom}>
                                Reset
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={zoomIn}
                                disabled={scale >= 3}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* PDF Document Viewer */}
                    <Card
                        className={cn(
                            'relative bg-white overflow-auto',
                            dragMode && 'cursor-crosshair'
                        )}
                        style={{ height: '700px' }}
                    >
                        {documentData.fileUrl ? (
                            <div className="relative mx-auto my-4">
                                <div
                                    ref={pdfViewerRef}
                                    onClick={(e) => {
                                        if (!dragMode && !e.ctrlKey && !e.metaKey) {
                                            setSelectedZones([]);
                                        }
                                    }}
                                    className="relative inline-block"
                                >
                                    <Document
                                        file={documentData.fileUrl}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        onLoadError={onDocumentLoadError}
                                        options={PDF_OPTIONS}
                                        loading={
                                            <div className="flex items-center justify-center h-96">
                                                <div className="text-center">
                                                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-4"></div>
                                                    <p className="text-secondary-600 font-medium">Loading PDF...</p>
                                                    <p className="text-xs text-secondary-500 mt-2">This may take a few seconds</p>
                                                </div>
                                            </div>
                                        }
                                        error={
                                            <div className="flex items-center justify-center h-96">
                                                <div className="text-center">
                                                    <X className="h-16 w-16 mx-auto mb-4 text-red-400" />
                                                    <p className="text-red-600 font-medium">Failed to load PDF</p>
                                                    <p className="text-xs text-secondary-500 mt-2">Please check the file and try again</p>
                                                </div>
                                            </div>
                                        }
                                    >
                                        <Page
                                            pageNumber={currentPage}
                                            scale={scale}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                            renderMode="canvas"
                                            onLoadSuccess={onPageLoadSuccess}
                                            loading={
                                                <div className="flex items-center justify-center" style={{ height: '500px', width: '100%' }}>
                                                    <div className="text-center">
                                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-2"></div>
                                                        <p className="text-sm text-secondary-600">Loading page {currentPage}...</p>
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </Document>

                                    {/* Drawing Overlay */}
                                    {dragMode && (
                                        <div
                                            className="absolute z-10"
                                            onMouseDown={handleDrawingStart}
                                            onMouseMove={handleDrawingMove}
                                            onMouseUp={handleDrawingEnd}
                                            style={{
                                                cursor: 'crosshair',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0
                                            }}
                                        />
                                    )}

                                    {/* Current Drawing Rectangle */}
                                    {isDrawing && currentDrawing && (
                                        <div
                                            className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none z-20"
                                            style={{
                                                left: currentDrawing.x,
                                                top: currentDrawing.y,
                                                width: currentDrawing.width,
                                                height: currentDrawing.height,
                                            }}
                                        >
                                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                                {Math.round(currentDrawing.width)} × {Math.round(currentDrawing.height)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Signature Zones */}
                                    {currentZones.map(zone => {
                                        const signer = getSignerById(zone.signerId);
                                        if (!signer) return null;

                                        // Get canvas element to calculate display positions
                                        const pdfContainer = pdfViewerRef.current;
                                        const canvas = pdfContainer?.querySelector('canvas');
                                        if (!canvas) return null;

                                        const canvasWidth = canvas.offsetWidth;
                                        const canvasHeight = canvas.offsetHeight;

                                        // Convert PDF page percentages (0-100) to canvas pixels for display
                                        // Zone coordinates are stored as percentages of PDF page dimensions (0-100)
                                        // Canvas displays PDF proportionally, so we can use canvas size directly
                                        // Divide by 100 to convert to 0-1 range, then multiply by canvas size
                                        const pixelX = (zone.x / 100) * canvasWidth;
                                        const pixelY = (zone.y / 100) * canvasHeight;
                                        const pixelWidth = (zone.width / 100) * canvasWidth;
                                        const pixelHeight = (zone.height / 100) * canvasHeight;

                                        return (
                                            <div
                                                key={zone.id}
                                                className="absolute cursor-move"
                                                style={{
                                                    left: `${pixelX}px`,
                                                    top: `${pixelY}px`,
                                                    width: `${pixelWidth}px`,
                                                    height: `${pixelHeight}px`,
                                                }}
                                                onMouseDown={(e) => {
                                                    if (dragMode) return; // Don't allow drag during draw mode
                                                    e.stopPropagation();

                                                    const startX = e.clientX;
                                                    const startY = e.clientY;
                                                    const startLeft = pixelX;
                                                    const startTop = pixelY;

                                                    const handleMouseMove = (moveEvent: MouseEvent) => {
                                                        const deltaX = moveEvent.clientX - startX;
                                                        const deltaY = moveEvent.clientY - startY;

                                                        const newX = Math.max(0, Math.min(startLeft + deltaX, canvasWidth - pixelWidth));
                                                        const newY = Math.max(0, Math.min(startTop + deltaY, canvasHeight - pixelHeight));

                                                        // Convert canvas pixels back to PDF page percentages (0-100)
                                                        updateZone(zone.id, {
                                                            x: (newX / canvasWidth) * 100,
                                                            y: (newY / canvasHeight) * 100,
                                                        });
                                                    };

                                                    const handleMouseUp = () => {
                                                        document.removeEventListener('mousemove', handleMouseMove);
                                                        document.removeEventListener('mouseup', handleMouseUp);
                                                    };

                                                    document.addEventListener('mousemove', handleMouseMove);
                                                    document.addEventListener('mouseup', handleMouseUp);
                                                }}
                                            >
                                                <div
                                                    className={cn(
                                                        'border-2 border-dashed bg-opacity-20 flex items-center justify-center text-xs font-medium relative group transition-all cursor-pointer w-full h-full',
                                                        selectedZones.includes(zone.id) ? 'ring-2 ring-blue-400 shadow-lg' : ''
                                                    )}
                                                    style={{
                                                        borderColor: signer.color,
                                                        backgroundColor: selectedZones.includes(zone.id)
                                                            ? signer.color + '50'
                                                            : signer.color + '33',
                                                        color: signer.color
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        selectZone(zone.id, e.ctrlKey || e.metaKey);
                                                    }}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingZone(zone);
                                                    }}
                                                >
                                                    <span className="pointer-events-none text-center px-1">
                                                        {zone.label || signer.name}
                                                    </span>

                                                    {/* Selection Indicator */}
                                                    {selectedZones.includes(zone.id) && (
                                                        <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <Check className="w-2 h-2 text-white" />
                                                        </div>
                                                    )}

                                                    {/* Zone Controls */}
                                                    <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-lg border flex">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingZone(zone);
                                                            }}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeZone(zone.id);
                                                            }}
                                                            className="h-6 w-6 p-0 text-red-600"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    {/* Resize Handles */}
                                                    <div
                                                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize"
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            if (dragMode) return;

                                                            const startX = e.clientX;
                                                            const startY = e.clientY;
                                                            const startWidth = pixelWidth;
                                                            const startHeight = pixelHeight;

                                                            const handleMouseMove = (moveEvent: MouseEvent) => {
                                                                const deltaX = moveEvent.clientX - startX;
                                                                const deltaY = moveEvent.clientY - startY;

                                                                const newWidth = Math.max(50, Math.min(startWidth + deltaX, canvasWidth - pixelX));
                                                                const newHeight = Math.max(20, Math.min(startHeight + deltaY, canvasHeight - pixelY));

                                                                // Convert canvas pixels back to PDF page percentages (0-100)
                                                                updateZone(zone.id, {
                                                                    width: (newWidth / canvasWidth) * 100,
                                                                    height: (newHeight / canvasHeight) * 100,
                                                                });
                                                            };

                                                            const handleMouseUp = () => {
                                                                document.removeEventListener('mousemove', handleMouseMove);
                                                                document.removeEventListener('mouseup', handleMouseUp);
                                                            };

                                                            document.addEventListener('mousemove', handleMouseMove);
                                                            document.addEventListener('mouseup', handleMouseUp);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <FileText className="h-16 w-16 mx-auto mb-4 text-secondary-400" />
                                    <p className="text-secondary-600">No document uploaded</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Zones Summary */}
            {documentData.signatureZones.length > 0 && (
                <Card className="p-4">
                    <h3 className="font-medium text-secondary-900 mb-3">
                        Placed Zones ({documentData.signatureZones.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {documentData.signatureZones.map(zone => {
                            const signer = getSignerById(zone.signerId);
                            if (!signer) return null;

                            return (
                                <div key={zone.id} className="flex items-center justify-between text-sm p-2 bg-secondary-50 rounded">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded"
                                            style={{ backgroundColor: signer.color }}
                                        />
                                        <span className="text-xs">
                                            {signer.name} - Page {zone.page}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingZone(zone)}
                                            className="h-6 w-6 p-0"
                                        >
                                            <Eye className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeZone(zone.id)}
                                            className="h-6 w-6 p-0 text-red-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Edit Zone Modal */}
            {editingZone && (() => {
                // Zone coordinates are already in 0-100 percentage format
                // No need to convert from page dimensions

                return (
                    <Modal
                        isOpen={true}
                        onClose={() => setEditingZone(null)}
                        title="Edit Signature Zone"
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Page
                                    </label>
                                    <Select
                                        value={editingZone.page.toString()}
                                        onChange={(e) => setEditingZone({ ...editingZone, page: parseInt(e.target.value) })}
                                        options={Array.from({ length: numPages || 1 }, (_, i) => ({
                                            value: (i + 1).toString(),
                                            label: `Page ${i + 1}`
                                        }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Label (optional)
                                    </label>
                                    <Input
                                        type="text"
                                        value={editingZone.label || ''}
                                        onChange={(e) => setEditingZone({ ...editingZone, label: e.target.value })}
                                        placeholder="e.g., Signature"
                                    />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
                                💡 Coordinates are stored as percentages (0-100) of the PDF page dimensions
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        X Position (%)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={editingZone.x.toFixed(2)}
                                        onChange={(e) => {
                                            const newX = parseFloat(e.target.value) || 0;
                                            setEditingZone({ ...editingZone, x: Math.max(0, Math.min(100, newX)) });
                                        }}
                                        min={0}
                                        max={100}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Y Position (%)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={editingZone.y.toFixed(2)}
                                        onChange={(e) => {
                                            const newY = parseFloat(e.target.value) || 0;
                                            setEditingZone({ ...editingZone, y: Math.max(0, Math.min(100, newY)) });
                                        }}
                                        min={0}
                                        max={100}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Width (%)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={editingZone.width.toFixed(2)}
                                        onChange={(e) => {
                                            const newWidth = parseFloat(e.target.value) || 1;
                                            setEditingZone({ ...editingZone, width: Math.max(1, Math.min(100, newWidth)) });
                                        }}
                                        min={1}
                                        max={100}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Height (%)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={editingZone.height.toFixed(2)}
                                        onChange={(e) => {
                                            const newHeight = parseFloat(e.target.value) || 1;
                                            setEditingZone({ ...editingZone, height: Math.max(1, Math.min(100, newHeight)) });
                                        }}
                                        min={1}
                                        max={100}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditingZone(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        updateZone(editingZone.id, editingZone);
                                        setEditingZone(null);
                                        toast.success('Zone updated successfully');
                                    }}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </Modal>
                );
            })()}

            <div className="flex justify-between">
                <Button variant="outline" onClick={onPrevious}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!canProceed()}
                >
                    Next: Review & Send
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
