/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-teal': '#008ba8',
        'brand-yellow': '#fbbd08'
      }
    },
  },
  plugins: [],
}