/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'medical-primary': {
                    DEFAULT: '#0ea5e9',
                    dark: '#0369a1',
                    light: '#7dd3fc',
                },
                'medical-secondary': '#64748b',
                'medical-accent': '#2dd4bf',
                'medical-bg': '#f8fafc',
                'medical-navy': '#0f172a',
                'medical-surface': '#ffffff',
            },
            backgroundImage: {
                'medical-gradient': 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
                'premium-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #2dd4bf 100%)',
            },
            boxShadow: {
                'premium': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 10px -2px rgba(0, 0, 0, 0.03)',
                'premium-hover': '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 15px -5px rgba(0, 0, 0, 0.05)',
            }
        },
    },
    plugins: [],
}
