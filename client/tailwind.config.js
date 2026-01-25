module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blood: {
          crimson: '#B91C1C',
          red: '#DC2626',
          dark: '#1a1a2e',
          ash: '#16213e',
          night: '#0f0f23',
          bone: '#e5e5e5',
          muted: '#9ca3af',
        },
      },
      keyframes: {
        frenzy: {
          '0%': { opacity: 0, transform: 'scale(1)' },
          '30%': { opacity: 1 },
          '100%': { opacity: 0, transform: 'scale(1.15)' },
        },
        messy: {
          '0%': { opacity: 0 },
          '40%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
        bestial: {
          '0%': { transform: 'scale(0.6)', opacity: 0 },
          '60%': { opacity: 0.9 },
          '100%': { transform: 'scale(1.5)', opacity: 0 },
        },
      },
      animation: {
        frenzy: 'frenzy 1.8s ease-out',
        messy: 'messy 0.9s ease-in-out',
        bestial: 'bestial 1.2s ease-out',
      },
    },
  },
  plugins: [],
};
