/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ocean': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        'pressure': {
          low: '#00ff00',
          medium: '#ffff00',
          high: '#ff8800',
          critical: '#ff0000',
          catastrophic: '#8800ff'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bubble': 'bubble 4s ease-in infinite',
        'ripple': 'ripple 2s ease-out infinite',
      },
      keyframes: {
        bubble: {
          '0%': { transform: 'translateY(100%) scale(0.5)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '90%': { opacity: '0.5' },
          '100%': { transform: 'translateY(-100vh) scale(1)', opacity: '0' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
