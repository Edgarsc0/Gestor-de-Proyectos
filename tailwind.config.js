/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        display: ['"Outfit"', "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eff3ff",
          100: "#dbe4fe",
          200: "#bfcefe",
          300: "#93aafd",
          400: "#6480fa",
          500: "#4058f5",
          600: "#2a37ea",
          700: "#2229d7",
          800: "#2124ae",
          900: "#202489",
          950: "#181953",
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
