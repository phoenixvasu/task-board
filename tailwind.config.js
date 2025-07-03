/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366F1", // Indigo
          dark: "#4F46E5",
        },
        secondary: {
          DEFAULT: "#3F3F46", // Zinc
          light: "#94A3B8", // Slate
        },
        accent: "#10B981", // Emerald
        danger: "#F43F5E", // Rose
        warning: "#F59E0B", // Amber
        info: "#38BDF8", // Sky
        bg: "#F9FAFB", // Light background
        darkbg: "#0F172A", // Dark background
        ring: "#6366F1", // Ring color for focus states
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
