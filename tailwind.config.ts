/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aerojet: {
          blue: '#002D62', // Deep corporate blue
          light: '#0056b3', // Lighter hover state
          gold: '#C5A059',  // Accent gold (common in aviation)
        },
      },
    },
  },
  plugins: [],
};
