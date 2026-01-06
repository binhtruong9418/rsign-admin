import { pdfjs } from 'react-pdf';

// Configure PDF.js worker globally - only once
// This prevents multiple worker initializations and potential null reference errors
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
    ).toString();
}

// PDF.js options that should be reused across components
export const PDF_OPTIONS = {
    cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.296/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.4.296/standard_fonts/',
    enableXfa: false,
} as const;

// Export pdfjs for convenience
export { pdfjs };
