/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        income: '#22C55E',
        expense: '#EF4444',
        warning: '#F59E0B',
      },
    },
  },
  plugins: [],
}

