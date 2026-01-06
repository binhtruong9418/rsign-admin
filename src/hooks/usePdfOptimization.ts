import { useEffect, useState } from "react";

/**
 * Custom hook to optimize PDF loading and caching
 * Implements lazy loading and memory management for PDF pages
 */
export function usePdfOptimization() {
    const [cachedPages, setCachedPages] = useState<Map<string, any>>(new Map());

    // Clear cache when component unmounts to prevent memory leaks
    useEffect(() => {
        return () => {
            setCachedPages(new Map());
        };
    }, []);

    const cachePageData = (pageKey: string, data: any) => {
        setCachedPages((prev) => {
            const newCache = new Map(prev);
            // Limit cache size to prevent memory issues (max 10 pages)
            if (newCache.size >= 10) {
                const firstKey = newCache.keys().next().value;
                if (firstKey) newCache.delete(firstKey);
            }
            newCache.set(pageKey, data);
            return newCache;
        });
    };

    const getCachedPage = (pageKey: string) => {
        return cachedPages.get(pageKey);
    };

    const clearCache = () => {
        setCachedPages(new Map());
    };

    return {
        cachePageData,
        getCachedPage,
        clearCache,
        cacheSize: cachedPages.size,
    };
}

/**
 * Debounce hook for optimizing frequent updates
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
