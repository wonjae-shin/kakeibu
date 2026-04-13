/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#EA580C',
        income: '#22C55E',
        expense: '#EF4444',
        warning: '#F59E0B',
        background: '#F5F3F0',
        surface: '#FFFFFF',
      },
      borderRadius: {
        'card': '1rem',
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        shake: 'shake 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
}

