import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        cardForeground: "var(--card-foreground)",
        muted: "var(--muted)",
        mutedForeground: "var(--muted-foreground)",
        accent: "var(--accent)",
        accentForeground: "var(--accent-foreground)",
        border: "var(--border)",
        ring: "var(--ring)",
        positive: "var(--positive)",
        negative: "var(--negative)",
        warning: "var(--warning)"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(20, 18, 15, 0.08)",
        lift: "0 15px 40px rgba(20, 18, 15, 0.12)"
      },
      borderRadius: {
        xl: "1.25rem"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
