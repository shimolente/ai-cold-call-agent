/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#352654',
        'primary-light': '#4a3870',
        'primary-dark': '#2a1d42',
      },
    },
  },
  plugins: [],
}