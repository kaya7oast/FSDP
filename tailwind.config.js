/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#3b82f6',
        'success': '#22c55e',
        'danger': '#ef4444',
        'inactive': '#9ca3af',
        'background-light': '#ffffff',
        'background-dark': '#1a1a1a',
        'text-light': '#111827',
        'text-dark': '#ffffff',
        'border-light': '#e5e7eb',
        'border-dark': '#2a2a2a',
      },
      fontFamily: {
        'display': "'Inter', sans-serif",
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
