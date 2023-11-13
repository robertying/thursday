import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import daisyui from "daisyui";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {},
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#9a25ae",
          "primary-content": "#fff",
          secondary: "#6b586b",
          "secondary-content": "#fff",
          accent: "#82524a",
          "accent-content": "#fff",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "#f9abff",
          "primary-content": "#570066",
          secondary: "#d7bfd5",
          "secondary-content": "#3b2b3c",
          accent: "#f6b8ad",
          "accent-content": "#4c251f",
        },
      },
    ],
  },
  plugins: [typography, daisyui],
};

export default config;
