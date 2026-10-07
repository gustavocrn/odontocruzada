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
        navy: {
          50: "#F0F4F9",
          100: "#E1E8F0",
          200: "#C3D1E3",
          300: "#94ADC9",
          400: "#6084AD",
          500: "#385E8E",
          600: "#24436C",
          700: "#182E4B",
          800: "#0F172A",
          900: "#0B192C",
          950: "#060D1A",
        },
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        lead: {
          novo: {
            bg: "#EFF6FF",
            text: "#1D4ED8",
            border: "#BFDBFE",
          },
          quente: {
            bg: "#FEF2F2",
            text: "#DC2626",
            border: "#FECACA",
          },
          morno: {
            bg: "#FFFBEB",
            text: "#D97706",
            border: "#FDE68A",
          },
          planejamento: {
            bg: "#F3E8FF",
            text: "#7E22CE",
            border: "#E9D5FF",
          },
          qualificado: {
            bg: "#ECFDF5",
            text: "#047857",
            border: "#A7F3D0",
          }
        }
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "Inter", "sans-serif"],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(15, 23, 42, 0.05), 0 4px 6px -2px rgba(15, 23, 42, 0.02)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'dropdown': '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out forwards",
        "slide-in": "slide-in 0.3s ease-out forwards",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        }
      }
    },
  },
  plugins: [],
};
