import type { Config } from "tailwindcss";

const config: Config = {
  // Class-based instead of the default "media" strategy: this app commits
  // to one soft, cool light palette everywhere rather than following the
  // visitor's OS dark-mode setting (which was the actual cause of pages
  // looking dark regardless of any color changes made elsewhere - Tailwind's
  // dark: variant reacts to prefers-color-scheme independently of any CSS
  // here). No element ever gets a "dark" class, so every dark: utility is
  // now permanently inert without needing to strip it from every file.
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
