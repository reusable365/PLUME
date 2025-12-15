/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./index.tsx",
        "./App.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Lora', 'serif'],
            },
            colors: {
                ink: {
                    50: 'var(--ink-50)',
                    100: 'var(--ink-100)',
                    200: 'var(--ink-200)',
                    300: 'var(--ink-300)',
                    400: 'var(--ink-400)',
                    500: 'var(--ink-500)',
                    600: 'var(--ink-600)',
                    700: 'var(--ink-700)',
                    800: 'var(--ink-800)',
                    900: 'var(--ink-900)',
                },
                paper: 'var(--paper-color)',
                accent: {
                    DEFAULT: '#b45309',
                    light: '#d97706',
                    dark: '#78350f',
                },
                surface: 'var(--surface-color)',
            }
        },
    },
    plugins: [],
}
