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
        background: "#0B0D12",
        sidebar: "#11141C",
        card: "#161922",
        cardHover: "#1C202B",
        border: "#1E2330",
        borderLight: "#2A3042",
        accent: {
          blue: "#3B82F6",
          indigo: "#6366F1",
          purple: "#8B5CF6",
          cyan: "#06B6D4",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
