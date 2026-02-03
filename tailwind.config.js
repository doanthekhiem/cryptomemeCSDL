/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk color palette
        'cyber-bg': '#0a0a0f',
        'cyber-primary': '#1a1a2e',
        'cyber-secondary': '#16213e',
        'cyber-tertiary': '#0f3460',
        'neon-cyan': '#00fff5',
        'neon-magenta': '#ff00ff',
        'neon-purple': '#bf00ff',
        'neon-gold': '#ffd700',
        'pump-green': '#00ff88',
        'dump-red': '#ff4757',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 0.5s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
        'neon-flicker': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
