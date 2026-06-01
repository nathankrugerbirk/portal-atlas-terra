import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        atlas: {
          cyan:      "#00E6FF",
          "cyan-mid": "#0099AA",
          "bg-deep":  "#0D1117",
          "bg-card":  "#1A1F24",
          "bg-elevated": "#2B3138",
          surface:   "#3A3F44",
          "text-primary": "#F6F8FA",
          "text-muted":   "#8B949E",
          border:    "#1A1F24",
          glow:      "rgba(0,230,255,0.15)",
        },
      },
      fontFamily: {
        exo: ["'Exo 2'", "Rajdhani", "Orbitron", "sans-serif"],
      },
      backgroundImage: {
        "atlas-gradient": "linear-gradient(160deg, #0D1117 0%, #0D1117 100%)",
        "atlas-card":     "linear-gradient(135deg, #1A1F24 0%, #1A1F24 100%)",
        "atlas-glow":     "radial-gradient(ellipse at center, rgba(0,230,255,0.12) 0%, transparent 70%)",
      },
      boxShadow: {
        "glow":        "0 0 12px rgba(0,230,255,0.3)",
        "glow-strong": "0 0 24px rgba(0,230,255,0.5)",
        "glow-subtle": "0 0 40px rgba(0,230,255,0.08)",
        card:          "0 4px 24px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-in":  "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        float:      "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
