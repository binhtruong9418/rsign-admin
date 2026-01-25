import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { X } from 'lucide-react';
import { PDF_OPTIONS } from '@/lib/pdf-worker';
import { PDFErrorBoundary } from '@/components/ui/PDFErrorBoundary';

export interface PDFDocumentProps {
    fileUrl: string;
    currentPage: number;
    scale: number;
    onLoadSuccess: (data: { numPages: number }) => void;
    onPageLoadSuccess?: (page: any) => void;
    renderTextLayer?: boolean;
    renderAnnotationLayer?: boolean;
    children?: React.ReactNode;
    className?: string;
}

export function PDFDocument({
    fileUrl,
    currentPage,
    scale,
    onLoadSuccess,
    onPageLoadSuccess,
    renderTextLayer = true,
    renderAnnotationLayer = false,
    children,
    className = ''
}: PDFDocumentProps) {
    return (
        <PDFErrorBoundary>
            <div className={`relative inline-block ${className}`}>
                <Document
                    file={fileUrl}
                    onLoadSuccess={onLoadSuccess}
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
                        renderTextLayer={renderTextLayer}
                        renderAnnotationLayer={renderAnnotationLayer}
                        onLoadSuccess={onPageLoadSuccess}
                        loading={
                            <div className="flex items-center justify-center" style={{ height: '500px', width: '100%' }}>
                                <div className="text-center">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-2"></div>
                                    <p className="text-sm text-secondary-600">Loading page {currentPage}...</p>
                                </div>
                            </div>
                        }
                        className="shadow-lg"
                    />
                </Document>

                {/* Overlay children (zones, etc.) */}
                {children}
            </div>
        </PDFErrorBoundary>
    );
}
