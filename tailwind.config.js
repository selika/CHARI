/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'medical-primary': '#0ea5e9', // Sky 500
                'medical-secondary': '#64748b', // Slate 500
                'medical-bg': '#f8fafc', // Slate 50
            }
        },
    },
    plugins: [],
}
