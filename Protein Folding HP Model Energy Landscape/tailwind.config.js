/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      colors: {
        'space-dark': '#0a1628',
        'space-blue': '#0f2744',
        'bio-blue': '#1e88e5',
        'energy-orange': '#ff7043',
        'hydrophobic': '#e53935',
        'polar': '#29b6f6',
        'contact-green': '#76ff03',
        'glass-bg': 'rgba(15, 39, 69, 0.7)',
        'glass-border': 'rgba(30, 136, 229, 0.3)'
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        'roboto-mono': ['"Roboto Mono"', 'monospace']
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(30, 136, 229, 0.5)',
        'glow-green': '0 0 15px rgba(118, 255, 3, 0.6)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(118, 255, 3, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(118, 255, 3, 0.8)' }
        }
      }
    }
  },
  plugins: []
}
