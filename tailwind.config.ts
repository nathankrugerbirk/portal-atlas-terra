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
          cyan: "#00E1FF",
          "cyan-dim": "#00B8D4",
          "dark-bg": "#081320",
          "dark-card": "#0D1E2C",
          "dark-border": "#122434",
          copper: "#FFA23A",
          "copper-dim": "#CC7A1A",
          white: "#F2F2F2",
          "deep-black": "#00070F",
          "dark-navy": "#000B13",
          "gray-tech": "#10191D",
          "gray-mid": "#1A2C3A",
          "gray-text": "#8BA3B5",
        },
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
      },
      backgroundImage: {
        "atlas-gradient": "linear-gradient(135deg, #081320 0%, #000B13 100%)",
        "atlas-card": "linear-gradient(135deg, #0D1E2C 0%, #081320 100%)",
        "atlas-cyan-glow":
          "radial-gradient(ellipse at center, rgba(0,225,255,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "cyan-glow": "0 0 20px rgba(0, 225, 255, 0.25), 0 0 40px rgba(0, 225, 255, 0.1)",
        "cyan-glow-sm": "0 0 10px rgba(0, 225, 255, 0.2)",
        "copper-glow": "0 0 20px rgba(255, 162, 58, 0.25)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
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
