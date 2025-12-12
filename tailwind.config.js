/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                // Professional SaaS Color Palette
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#2563eb', // Primary Blue
                    600: '#1d4ed8', // Primary Blue Hover
                    700: '#1e40af',
                    800: '#1e3a8a',
                    900: '#1e293b',
                },
                secondary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
                accent: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316', // CTA Orange
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                },
                // Status Colors (from design doc)
                status: {
                    draft: '#6b7280',
                    pending: '#f59e0b',
                    'in-progress': '#3b82f6',
                    completed: '#10b981',
                    cancelled: '#ef4444',
                },
                // Signer Colors for PDF zones
                signer: {
                    1: '#3b82f6', // Blue
                    2: '#10b981', // Green
                    3: '#f59e0b', // Yellow
                    4: '#ef4444', // Red
                    5: '#8b5cf6', // Purple
                    6: '#ec4899', // Pink
                },
            },
            boxShadow: {
                'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
                'soft-lg': '0 4px 16px 0 rgba(0, 0, 0, 0.12)',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}