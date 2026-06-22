import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        video: {
          surface: "hsl(var(--video-analysis-surface))",
          card: "hsl(var(--video-analysis-card))",
          foreground: "hsl(var(--video-analysis-foreground))",
          muted: "hsl(var(--video-analysis-muted))",
          border: "hsl(var(--video-analysis-border))",
          accent: "hsl(var(--video-analysis-accent))",
          "accent-foreground": "hsl(var(--video-analysis-accent-foreground))",
          input: "hsl(var(--video-analysis-input))",
          "input-foreground": "hsl(var(--video-analysis-input-foreground))",
        },
        energy: "hsl(var(--energy))",
        power: "hsl(var(--power))",
        speed: "hsl(var(--speed))",
        explosive: "hsl(var(--explosive))",
        self: {
          DEFAULT: "hsl(var(--self))",
          foreground: "hsl(var(--self-foreground))",
        },
        "tab-plan": "hsl(var(--tab-plan))",
        "tab-progress": "hsl(var(--tab-progress))",
        "tab-rehab": "hsl(var(--tab-rehab))",
        "tab-nutrition": "hsl(var(--tab-nutrition))",
        "tab-mental": "hsl(var(--tab-mental))",
        "landing-navy": "hsl(var(--landing-navy))",
        "landing-elevated": "hsl(var(--landing-navy-elevated))",
        "landing-red": "hsl(var(--landing-red))",
        "landing-red-hover": "hsl(var(--landing-red-hover))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
