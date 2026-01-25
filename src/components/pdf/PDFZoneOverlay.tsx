import { cn } from '@/lib/utils';

export interface Zone {
    id: string;
    page: number;
    x: number;        // Percentage 0-100
    y: number;        // Percentage 0-100
    width: number;    // Percentage 0-100
    height: number;   // Percentage 0-100
    label?: string;
    color?: string;
    signerId?: string;
    assignedUser?: {
        fullName?: string;
        email: string;
    };
}

export interface PDFZoneOverlayProps {
    zones: Zone[];
    currentPage: number;
    canvasWidth: number;
    canvasHeight: number;
    interactive?: boolean;
    selectedZones?: string[];
    onZoneClick?: (zoneId: string, multiSelect: boolean) => void;
    onZoneDoubleClick?: (zone: Zone) => void;
}

export function PDFZoneOverlay({
    zones,
    currentPage,
    canvasWidth,
    canvasHeight,
    interactive = false,
    selectedZones = [],
    onZoneClick,
    onZoneDoubleClick
}: PDFZoneOverlayProps) {
    const pageZones = zones.filter(zone => zone.page === currentPage);

    if (pageZones.length === 0) {
        return null;
    }

    return (
        <>
            {pageZones.map((zone) => {
                const isSelected = selectedZones.includes(zone.id);
                const color = zone.color || '#2563eb';

                // Convert percentage (0-100) to pixels
                const pixelX = (zone.x / 100) * canvasWidth;
                const pixelY = (zone.y / 100) * canvasHeight;
                const pixelWidth = (zone.width / 100) * canvasWidth;
                const pixelHeight = (zone.height / 100) * canvasHeight;

                return (
                    <div
                        key={zone.id}
                        className={cn(
                            "absolute border-2 border-dashed transition-all",
                            interactive ? "cursor-pointer" : "pointer-events-none",
                            isSelected && "ring-2 ring-blue-400 shadow-lg"
                        )}
                        style={{
                            left: `${pixelX}px`,
                            top: `${pixelY}px`,
                            width: `${pixelWidth}px`,
                            height: `${pixelHeight}px`,
                            borderColor: color,
                            backgroundColor: isSelected ? `${color}50` : `${color}20`,
                        }}
                        onClick={(e) => {
                            if (interactive && onZoneClick) {
                                e.stopPropagation();
                                onZoneClick(zone.id, e.ctrlKey || e.metaKey);
                            }
                        }}
                        onDoubleClick={(e) => {
                            if (interactive && onZoneDoubleClick) {
                                e.stopPropagation();
                                onZoneDoubleClick(zone);
                            }
                        }}
                    >
                        {/* Zone Label */}
                        <div
                            className="absolute left-0 top-0 text-white text-[10px] px-1 py-0.5 rounded-br font-medium"
                            style={{ backgroundColor: color }}
                        >
                            {zone.label || zone.assignedUser?.fullName || 'Signature'}
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && interactive && (
                            <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                        )}
                    </div>
                );
            })}
        </>
    );
}
