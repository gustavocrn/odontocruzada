/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dentist: {
          50: "hsl(185, 75%, 97%)",
          100: "hsl(185, 75%, 92%)",
          200: "hsl(185, 75%, 82%)",
          300: "hsl(185, 75%, 68%)",
          400: "hsl(185, 75%, 52%)",
          500: "hsl(185, 80%, 45%)", // Teal Odonto Principal
          600: "hsl(185, 85%, 38%)",
          700: "hsl(185, 85%, 30%)",
          800: "hsl(185, 85%, 22%)",
          900: "hsl(185, 85%, 15%)",
          950: "hsl(185, 90%, 8%)",
        },
        darkbg: {
          DEFAULT: "hsl(220, 30%, 8%)",
          surface: "hsl(220, 25%, 12%)",
          hover: "hsl(220, 25%, 16%)",
          border: "rgba(255, 255, 255, 0.08)",
        },
        lightbg: {
          DEFAULT: "hsl(220, 20%, 95%)",
          surface: "hsl(0, 0%, 100%)",
          hover: "hsl(220, 15%, 98%)",
          border: "rgba(0, 0, 0, 0.08)",
        }
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "sans-serif"],
      },
      animation: {
        "shake": "shake 0.3s ease-in-out",
        "pulse-correct": "pulse-correct 0.6s ease-out",
        "fade-in": "fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "pulse-correct": {
          "0%": { transform: "scale(1)", backgroundColor: "rgba(34, 197, 94, 0.2)" },
          "50%": { transform: "scale(1.1)", backgroundColor: "rgba(34, 197, 94, 0.6)" },
          "100%": { transform: "scale(1)", backgroundColor: "rgba(34, 197, 94, 0.1)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        }
      }
    },
  },
  plugins: [],
};
