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
          primary: "#1E40AF",      // JSO Blue
          secondary: "#10B981",    // JSO Green
          accent: "#F59E0B",       // JSO Orange
          dark: "#1F2937",         // Dark Gray
          light: "#F3F4F6",        // Light Gray
        },
      },
    },
  },
  plugins: [],
};

export default config;
