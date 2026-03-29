/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        display: ['"Outfit"', "system-ui", "sans-serif"],
        anam: ['"Times New Roman"', "Times", "serif"],
      },
      colors: {
        // ANAM — Rojo borgoña institucional
        brand: {
          50:  "#FFF1F1",
          100: "#FFE0E0",
          200: "#FFC8C8",
          300: "#FFA0A0",
          400: "#F06060",
          500: "#C93030",
          600: "#A31B1B",
          700: "#8B1515",
          800: "#721010",
          900: "#5C0D0D",
          950: "#360707",
        },
        // ANAM — Dorado institucional
        gold: {
          50:  "#FFFBEB",
          100: "#FFF3C4",
          200: "#FFE58A",
          300: "#FFD04D",
          400: "#F5B827",
          500: "#D4A020",
          600: "#B08018",
          700: "#8A6212",
          800: "#6E4E10",
          900: "#5A400E",
          950: "#332408",
        },
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      animation: {
        "slide-up": "slide-up 0.4s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
