import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    optimizeDeps: {
        include: ["pdfjs-dist"],
        exclude: ["pdfjs-dist/build/pdf.worker.min.mjs"],
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    pdfjs: ["pdfjs-dist"],
                    "react-pdf": ["react-pdf"],
                },
            },
        },
    },
    server: {
        fs: {
            allow: [".."],
        },
    },
});
