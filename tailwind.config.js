/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        si: {
          bg: "var(--si-bg)",
          surface: "var(--si-surface)",
          muted: "var(--si-muted)",
          weekend: "var(--si-weekend)",
          ink: "var(--si-ink)",
          inkSoft: "var(--si-inkSoft)",
          gray: "var(--si-gray)",
          grayLight: "var(--si-grayLight)",
          border: "var(--si-border)",
          borderSoft: "var(--si-borderSoft)",
          accent: "#6366F1",
          accentDark: "#4F46E5",
          accentSoft: "var(--si-accentSoft)",
          accentBg: "var(--si-accentBg)",
          violet: "#8B5CF6",
          violetSoft: "var(--si-violetSoft)",
          rose: "#F43F5E",
          amber: "#F59E0B",
          amberSoft: "var(--si-amberSoft)",
          success: "#10B981",
        },
      },
      boxShadow: {
        si: "0 1px 2px rgba(40,40,80,0.04), 0 4px 12px rgba(40,40,80,0.04)",
        "si-lg": "0 4px 24px rgba(40,40,80,0.08)",
        soft: "0 16px 35px rgba(15, 23, 42, 0.12)",
        "soft-dark": "0 16px 35px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};
