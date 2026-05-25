
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vine-dark': '#0a1f0a',
        'vine-green': '#1a472a',
        'vine-glow': '#39ff14',
        'light-gold': '#ffd700',
        'wither-brown': '#8b4513',
        'collision-red': '#ff4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
