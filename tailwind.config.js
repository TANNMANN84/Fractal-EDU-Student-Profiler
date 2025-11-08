/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,contexts,services,types,constants}/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}