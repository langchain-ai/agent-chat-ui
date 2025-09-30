/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./agent/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-family-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-family-serif)", "Georgia", "serif"],
        mono: ["var(--font-family-mono)", "monospace"],
      },
      colors: {
        background: "var(--colors-background)",
        surface: "var(--colors-surface)",
        text: "var(--colors-text)",
        border: "var(--colors-border)",

        primary: {
          DEFAULT: "var(--colors-primary)",
          foreground: "var(--colors-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--colors-secondary)",
          foreground: "var(--colors-secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--colors-accent)",
          foreground: "var(--colors-accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--colors-destructive)",
          foreground: "var(--colors-destructive-foreground)",
        },
        success: "var(--colors-success)",
        warning: "var(--colors-warning)",
        info: "var(--colors-info)",
        neutral: "var(--colors-neutral)",
      },

      textColor: {
        DEFAULT: "var(--semantic-text-primary)",
        secondary: "var(--semantic-text-secondary)",
        muted: "var(--semantic-text-muted)",
        inverse: "var(--semantic-text-inverse)",
      },
      backgroundColor: {
        DEFAULT: "var(--semantic-bg-primary)",
        secondary: "var(--semantic-bg-secondary)",
        subtle: "var(--semantic-bg-subtle)",
        inverse: "var(--semantic-bg-inverse)",
      },
      borderColor: {
        DEFAULT: "var(--semantic-border)",
        subtle: "var(--semantic-border-subtle)",
      },

      borderRadius: {
        lg: "var(--radius-lg, 0.75rem)",
        md: "var(--radius-md, 0.5rem)",
        sm: "var(--radius-sm, 0.25rem)",
      },

      components: {
        ".scrollbar-pretty":
          "overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("tailwind-scrollbar")],
};
