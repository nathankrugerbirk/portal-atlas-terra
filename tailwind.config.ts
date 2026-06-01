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
          cyan: "#00C8D9",
          "cyan-dim": "#009AAA",
          "dark-bg": "#0A1A26",
          "dark-card": "#111820",
          "dark-border": "#1A2C3A",
          copper: "#FF8C42",
          "copper-dim": "#CC6A20",
          white: "#FFFFFF",
          "deep-black": "#060E18",
          "dark-navy": "#060E18",
          "gray-tech": "#111820",
          "gray-mid": "#1A2C3A",
          "gray-text": "#6B7280",
        },
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
      },
      backgroundImage: {
        "atlas-gradient": "linear-gradient(135deg, #0A1A26 0%, #060E18 100%)",
        "atlas-card": "linear-gradient(135deg, #111820 0%, #0A1A26 100%)",
        "atlas-cyan-glow":
          "radial-gradient(ellipse at center, rgba(0,200,217,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "cyan-glow": "0 0 20px rgba(0,200,217,0.25), 0 0 40px rgba(0,200,217,0.1)",
        "cyan-glow-sm": "0 0 10px rgba(0,200,217,0.2)",
        "copper-glow": "0 0 20px rgba(255,140,66,0.25)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
      },
      animation: {
        "pulse-cyan": "pulseCyan 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        pulseCyan: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
