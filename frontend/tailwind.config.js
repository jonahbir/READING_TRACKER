/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          600: '#4B0082',
          700: '#3C0066',
        },
        emerald: {
          500: '#2ECC71',
          600: '#27AE60',
        },
      },
    },
  },
  plugins: [],
};