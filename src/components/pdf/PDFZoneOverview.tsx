import { cn } from '@/lib/utils';
import type { Zone } from './PDFZoneOverlay';

interface PDFZoneOverviewProps {
    zones: Zone[];
    currentPage: number;
    numPages: number | null;
    onPageJump: (page: number) => void;
}

export function PDFZoneOverview({
    zones,
    currentPage,
    numPages,
    onPageJump
}: PDFZoneOverviewProps) {
    if (zones.length === 0) {
        return null;
    }

    // Group zones by page
    const zonesByPage = zones.reduce((acc, zone) => {
        if (!acc[zone.page]) {
            acc[zone.page] = [];
        }
        acc[zone.page].push(zone);
        return acc;
    }, {} as Record<number, Zone[]>);

    const pages = Object.keys(zonesByPage)
        .map(Number)
        .sort((a, b) => a - b);

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                        Signature Zones Overview
                    </h4>
                    <p className="text-xs text-blue-700 mb-3">
                        {zones.length} signature zone{zones.length > 1 ? 's' : ''} across {pages.length} page{pages.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {pages.map(page => {
                            const pageZones = zonesByPage[page];
                            const isCurrentPage = page === currentPage;

                            return (
                                <button
                                    key={page}
                                    onClick={() => onPageJump(page)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                        "hover:shadow-md",
                                        isCurrentPage
                                            ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                                            : "bg-white text-blue-900 hover:bg-blue-100 border border-blue-200"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Page {page}</span>
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded text-xs font-bold",
                                            isCurrentPage
                                                ? "bg-blue-500 text-white"
                                                : "bg-blue-100 text-blue-700"
                                        )}>
                                            {pageZones.length}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
