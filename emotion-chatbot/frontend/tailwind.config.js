/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        void: "#0a0a0f",
        surface: "#111118",
        card: "#16161f",
        border: "#1e1e2e",
        accent: {
          DEFAULT: "#7c6af7",
          soft: "#a89ef7",
          glow: "rgba(124,106,247,0.15)",
        },
        emotion: {
          happy: "#f9c846",
          sad: "#5b9bd5",
          neutral: "#8b8fa8",
          angry: "#f05e5e",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "glow-ring": "glowRing 2s ease-in-out infinite",
        "emoji-pop": "emojiPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        glowRing: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(124,106,247,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(124,106,247,0)" },
        },
        emojiPop: {
          from: { opacity: 0, transform: "scale(0.5) rotate(-10deg)" },
          to: { opacity: 1, transform: "scale(1) rotate(0deg)" },
        },
      },
    },
  },
  plugins: [],
};
