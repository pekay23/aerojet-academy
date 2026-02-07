import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aerojet: {
          blue: '#002a5c',      // Deep Navy (Primary Brand)
          sky: '#4c9ded',       // Sky Blue (Highlights/Icons)
          light: '#2880b9',     // Strong Blue (Buttons/Hovers)
          'soft-blue': '#0073e6', // Bright Blue (Active States)
          slate: '#2c3e50',     // Dark Slate (Text/Headings)
          offwhite: '#f9f9f9',  // Light Backgrounds
        },
      },
    },
  },
  plugins: [],
};
export default config;
