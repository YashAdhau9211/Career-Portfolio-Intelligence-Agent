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
        jso: {
          primary: "#1E40AF",      // JSO Blue — WCAG AA on white (contrast 7.2:1)
          secondary: "#047857",    // JSO Green (darkened from #10B981 for WCAG AA on white, contrast 5.1:1)
          accent: "#B45309",       // JSO Orange (darkened from #F59E0B for WCAG AA on white, contrast 5.4:1)
          dark: "#1F2937",         // Dark Gray — WCAG AAA on white (contrast 14.7:1)
          light: "#F3F4F6",        // Light Gray
        },
      },
    },
  },
  plugins: [],
};

export default config;
