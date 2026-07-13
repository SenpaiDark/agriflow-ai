import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "#2D5A3D",
          dark: "#1F3F2B",
          light: "#3E7A54",
        },
        harvest: {
          DEFAULT: "#E8A33D",
          light: "#F3C078",
        },
      },
    },
  },
  plugins: [],
};
export default config;
