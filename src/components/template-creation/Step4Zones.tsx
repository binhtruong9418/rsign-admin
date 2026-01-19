import { lazy, Suspense } from 'react';

// Lazy load the PDF viewer to reduce initial bundle size
const Step4ZonesLazy = lazy(() => import('./Step4ZonesContent').then(module => ({ default: module.Step4ZonesContent })));

export function Step4Zones(props: any) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-4"></div>
                    <p className="text-secondary-600 font-medium">Loading PDF Editor...</p>
                    <p className="text-xs text-secondary-500 mt-2">Preparing workspace</p>
                </div>
            </div>
        }>
            <Step4ZonesLazy {...props} />
        </Suspense>
    );
}
