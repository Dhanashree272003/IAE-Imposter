/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          bg: '#080c14',
          card: '#0f172a',
          accent: '#00f0ff',
          purple: '#8a2be2',
          red: '#ff2e63',
          green: '#10b981',
          gold: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)' },
          '100%': { boxShadow: '0 0 25px rgba(0, 240, 255, 0.8), 0 0 40px rgba(138, 43, 226, 0.4)' }
        }
      }
    },
  },
  plugins: [],
}
