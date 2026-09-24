import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        drama: {
          950: "#090a0f",
          900: "#0e1118",
          850: "#141824",
          800: "#1a2030",
          700: "#242d42",
          600: "#364363",
          gold: "#e6af5d",
          crimson: "#d63851",
          cyan: "#00d2ff",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
